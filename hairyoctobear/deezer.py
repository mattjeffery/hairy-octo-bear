import json
import logging
from urllib import urlencode, quote_plus
import bmemcached
import httplib2

log = logging.getLogger(__name__)

def _deezer_request(url, args):
    if args:
        url += "?" + urlencode(args)

    log.debug("Request to Deezer API: {0}".format(url))
    status, resp = httplib2.Http().request(url)
    return resp


def get_release_from_deezer(request, search, token):
    url = "https://api.deezer.com/search/album"
    args= {"q": quote_plus(search.encode("utf8")),
           "output": "json",
           "access_token": token}

    def __get():
        return _deezer_request(url, args)

    results = json.loads(request.registry.get_or_create("deezer_search_album"+str(search), __get))

    if "data" in results and len(results["data"]):
        return results["data"][0]