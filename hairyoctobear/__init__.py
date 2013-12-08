import json
import os
from dogpile.cache import make_region
from pymongo import MongoClient
from wsgicors import CORS
from pyramid.config import Configurator, ConfigurationError


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """

    try:
        settings["api.token"] = os.environ["SEMETRIC_API"]
        settings["memcache.password"] = os.environ["MEMCACHIER_PASSWORD"]
        settings["memcache.servers"] = os.environ["MEMCACHIER_SERVERS"]
        settings["memcache.user"] = os.environ["MEMCACHIER_USERNAME"]
        settings["deezer.key"] = os.environ["DEEZER_KEY"]
    except KeyError as exc:
        raise ConfigurationError("Failed to load config from env: {0}".format(exc))

    config = Configurator(settings=settings)
    #config.add_route('mongo_chart', '/chart/{id}')
    config.add_route('augment_chart', '/chart/{id}')
    config.add_route('proxy', '/*url')
    config.scan()

    config.include("hairyoctobear.api")

    registry = config.registry

    registry._cache_region = make_region().configure(
        'dogpile.cache.bmemcached',
        expiration_time = None,
        arguments = {
            'url': settings["memcache.servers"].split(),
            'username':settings["memcache.user"],
            'password':settings["memcache.password"]
        }
    )


    registry.get_or_create = registry._cache_region.get_or_create

    mongo_uri = os.environ["MONGOHQ_URL"]
    mongo_db = mongo_uri.rsplit('/', 1)[-1]

    mongo = MongoClient(mongo_uri)
    db = mongo[mongo_db]
    registry.charts = db['charts']

    def get_chart(request, chart_id):
        city = request.params.get('city', 'London')
        key = "{0}-chart-{1}".format(chart_id, city.lower())
        res = registry.charts.find_one({"key": key})
        if res:
            return json.loads(res['value'])

    config.add_request_method(get_chart)

    return CORS(config.make_wsgi_app(),
                headers="*",
                methods="*",
                maxage="180",
                origin="copy",
                credentials="true")
