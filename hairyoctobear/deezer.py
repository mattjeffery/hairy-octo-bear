import json
import logging
import random
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

    results = json.loads(request.registry.get_or_create("deezer_search_album_" + str(search), __get,
                                                        should_cache_fn=dont_cache_none)) or {}

    if "data" in results and len(results["data"]):
        log.info("{0} results for {1}".format(len(results["data"]), search))
        for result in results["data"]:
            if "tribute" not in result["title"].lower():
                return results["data"][0]
    else:
        log.info("0 results for {0}".format(search))


def get_preview_for_album(request, album_id, token):
    url = "http://api.deezer.com/album/{0}".format(album_id)
    args = {"output": "json",
            "access_token": token}

    def __get():
        return _deezer_request(url, args)

    result = json.loads(
        request.registry.get_or_create("deezer_album_" + str(album_id), __get, should_cache_fn=dont_cache_none)) or {}

    try:
        return random.choice(result["tracks"]["data"])["preview"]
    except KeyError:
        return None
