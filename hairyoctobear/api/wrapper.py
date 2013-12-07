import logging
try:
    import json
except ImportError:
    import simplejson as json  # pylint: disable=W801

try:
    from pyramid_debugtoolbar.utils import SETTINGS_PREFIX as PYRAMID_DEBUGTOOLBAR_SETTINGS_PREFIX
    has_pyramid_debugtoolbar = True
except ImportError:
    has_pyramid_debugtoolbar = False

from pyramid.settings import asbool
from pyramid.response import Response
from hairyoctobear.api.exceptions import (
    APIError,
    APINotFound
)

log = logging.getLogger(__name__)


class APIWrapper(object):

    def __init__(self, serializer=json.dumps, **kwargs):
        self.serializer = serializer
        self.kw = kwargs

    def __call__(self, value, **kwargs):
        """
            Simple method to wrap the results from views up in the standard api
            success envelope.
        """
        return self.serializer(self.envelope(success=True, response=value), **kwargs)

    def envelope(self, success, error=None, response=None):
        """
            Package up an API response
        """
        reply = {"success": success}
        if error:
            reply["error"] = error
        if response:
            reply["response"] = response
        return reply

    def response(self, request, error):
        """
            Render an API Response

            Create a Response object, similar to the JSONP renderer
            [TODO: re-factor in to the JSONP renderer]
            Return the Response object with the appropriate error code
        """

        jsonp_render = request.registry._jsonp_render

        default = jsonp_render._make_default(request)
        val = self.serializer(self.envelope(success=False, error=error.error),
                              default=default,
                              **jsonp_render.kw)
        callback = request.GET.get(jsonp_render.param_name)
        response = Response("", status=200)  # API Error code is always 200

        if callback is None:
            ct = 'application/json'
            response.status = error.code
            response.body = val
        else:
            ct = 'application/javascript'
            response.text = '%s(%s)' % (callback, val)

        if response.content_type == response.default_content_type:
            response.content_type = ct
        return response

    def handle_exception(self, request, exc):
        """
            Wrap a standard exception up in an APIError
        """
        # Generic error
        apierror = APIError.from_exception(exc=exc)
        return self.handle_api_exception(request, exc=apierror)

    def handle_api_exception(self, request, exc):
        # Generic error
        return self.response(request, exc.error)

    @staticmethod
    def not_found(request):
        raise APINotFound()


def api_exception_tween_factory(handler, registry):
    """
        Create the tween factory for catching exceptions raised by API code
    """
    # detect if pyramid_debugtoolbar is running
    if has_pyramid_debugtoolbar:
        settings = registry.settings
        pyramid_debugtoolbar_enabled = PYRAMID_DEBUGTOOLBAR_SETTINGS_PREFIX + 'enabled'
        pyramid_debugtoolbar = asbool(settings.get(pyramid_debugtoolbar_enabled, 'false'))
        log.debug("pyramid_debugtoolbar is enabled")
    else:
        pyramid_debugtoolbar = False

    def api_exception_tween(request):
        api_wrapper = registry._api_wrapper
        try:
            return handler(request)
        # render API Errors accordingly
        except APIError as exc:
            log.debug("Caught APIError Exception: {0}".format(exc))
            # Render an API exception
            return api_wrapper.response(request, exc)
        except Exception as exc:
            # if the debug tool bar is running then just raise the exception
            # TODO: what if pyramid_debugtoolbar is only enabled for admins?
            if pyramid_debugtoolbar:
                raise
            else:
                apiexc = APIError.from_exception(exc)
                return api_wrapper.response(request, apiexc)

    return api_exception_tween
