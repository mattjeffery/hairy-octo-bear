import json
from urllib import urlencode
import httplib2
import logging

from pyramid.view import view_config

log = logging.getLogger(__name__)


def _api_request(api_path, api_token, args):
    """
    Proxys a request to the semetric api
    :param api_path: api path on the semetric api
    :param api_token: semetric api token
    :param args: api args
    """
    url = "http://app.musicmetric.com/api/{path}".format(path=api_path)
    if "token" not in args:
        args["token"] = api_token
    if args:
        url += "?" + urlencode(args)
    log.debug("Proxying request to {0}".format(url))
    status, resp = httplib2.Http().request(url)
    return json.loads(resp)


@view_config(route_name='proxy', renderer='jsonp')
def api_proxy(request):
    log.debug("Matched: {0}".format(request.matchdict))
    api_path = '/'.join(request.matchdict.get("url"))

    # add the query arguments
    args = dict(request.params)
    if "_method" not in args:
        args["_method"] = request.method

    api_token = request.registry.settings["api.token"]

    return _api_request(api_path, api_token, args)
