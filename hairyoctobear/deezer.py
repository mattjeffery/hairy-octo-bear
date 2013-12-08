import json
import logging
from urllib import urlencode, quote_plus
import bmemcached
import httplib2

log = logging.getLogger(__name__)


def dont_cache_none(value):
    return json.loads(value) is not None


def _deezer_request(url, args):
    if args:
        url += "?" + urlencode(args)

    log.debug("Request to Deezer API: {0}".format(url))
    status, resp = httplib2.Http().request(url)
    if "error" in json.loads(resp):
        return "null"
    return resp


def get_release_from_deezer(request, search, token):
    url = "https://api.deezer.com/search/album"
    args = {"q": quote_plus(search.encode("utf8")),
            "output": "json",
            "access_token": token}

    def __get():
        return _deezer_request(url, args)

    results = json.loads(request.registry.get_or_create("deezer_search_album" + str(search), __get,
                                                        should_cache_fn=dont_cache_none)) or {}

    if "data" in results and len(results["data"]):
        return results["data"][0]


def get_preview_for_album(request, album_id, token):
    url = "http://api.deezer.com/album/{0}".format(album_id)
    args = {"output": "json",
            "access_token": token}

    def __get():
        return _deezer_request(url, args)

    result = json.loads(
        request.registry.get_or_create("deezer_album" + str(album_id), __get, should_cache_fn=dont_cache_none)) or {}

    try:
        return result["tracks"]["data"][0]["preview"]
    except KeyError:
        return None
