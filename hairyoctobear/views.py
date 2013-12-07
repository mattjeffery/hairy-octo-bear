import json
from urllib import urlencode
import httplib2
import logging

from pyramid.view import view_config
from hairyoctobear.api.exceptions import APIError
from hairyoctobear.deezer import get_release_from_deezer, get_preview_for_album

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
    settings = request.registry.settings
    chart_id = request.matchdict.get("id")
    chart = _proxy_api_request(request, "/chart/{id}".format(id=chart_id))
    chart["data"] = chart["data"][:50]
    chartd = chart["data"]

    max_i = len(chartd)
    i = 0

    while i < max_i - 1:
        j = i+1
        while j < max_i:
            if "releasegroup" in chartd[i] and "releasegroup" in chartd[j]:
                if chartd[i]["releasegroup"]["name"] == chartd[j]["releasegroup"]["name"]:
                    log.debug("Deleting release {0} {1}".format(j, chartd[j]["releasegroup"]))
                    chartd[i]["releasegroup"]["artists"].extend(chartd[j]["releasegroup"]["artists"])
                    chartd.pop(j)
                    max_i = len(chartd)
                else:
                    j += 1
            else:
                j += 1
        i += 1

    for i, entity in enumerate(chartd):
        entity["rank"] = i+1
        if "releasegroup" in entity:
            rg = entity["releasegroup"]
            drg = get_release_from_deezer(request, rg["name"], settings["deezer.key"])
            entity["releasegroup"]["images"] = [{"size": 120, "url": drg and drg["cover"]}]

            entity["preview_url"] = drg and get_preview_for_album(request, drg["id"], settings["deezer.key"])
    return chart

