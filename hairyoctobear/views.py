import json
from urllib import urlencode
import httplib2
import logging

from pyramid.view import view_config

log = logging.getLogger(__name__)


@view_config(route_name='proxy', renderer='json')
def api_proxy(request):
    http = httplib2.Http()
    log.debug("Matched: {0}".format(request.matchdict))
    api_path = '/'.join(request.matchdict.get("url"))
    url = "http://app.musicmetric.com/api/{path}".format(path=api_path)

    # add the query arguments
    args = dict(request.params)
    if "_method" not in args:
        args["_method"] = request.method

    if "token" not in args:
        args["token"] = request.registry.settings["api.token"]

    if args:
        url += "?"+urlencode(args)
    log.debug("Proxying request to {0}".format(url))
    status, resp = http.request(url)

    return json.loads(resp)
