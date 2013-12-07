import json
from urllib import urlencode
import httplib2
import logging

from pyramid.view import view_config
from hairyoctobear.api.exceptions import APIError

log = logging.getLogger(__name__)


def _api_request(api_path, api_token, args):
    """
    Proxys a request to the semetric api
    :param api_path: api path on the semetric api
    :param api_token: semetric api token
    :param args: api args
    """
    api_path = api_path.lstrip("/")
    url = "http://app.musicmetric.com/api/{path}".format(path=api_path)
    if "token" not in args:
        args["token"] = api_token
    if args:
        url += "?" + urlencode(args)
    log.debug("Proxying request to {0}".format(url))
    status, resp = httplib2.Http().request(url)
    return json.loads(resp)


def _proxy_api_request(request, api_path):
    # add the query arguments
    args = dict(request.params)
    if "_method" not in args:
        args["_method"] = request.method
    api_token = request.registry.settings["api.token"]
    resp = _api_request(api_path, api_token, args)

    if not resp["success"]:
        raise APIError(resp["error"]["code"], resp["error"]["msg"])

    return resp["response"]


@view_config(route_name='proxy', renderer='jsonp')
def api_proxy(request):
    log.debug("Matched: {0}".format(request.matchdict))
    api_path = '/'.join(request.matchdict.get("url"))

    return _proxy_api_request(request, api_path)


@view_config(route_name='augment_chart', renderer='jsonp')
def augment_chart(request):
    """
    augment a chart with preview data for items
    :param request:
    :return:
    """
    chart_id = request.matchdict.get("id")
    chart = _proxy_api_request(request, "/chart/{id}".format(id=chart_id))
    for entity in chart["data"]:
        entity["preview_url"] = "http://www.pop-machine.de/music/Lars_Vegas/Never_gonna_give_you_up.MP3"
    return chart

