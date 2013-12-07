import os
from dogpile.cache import make_region
from wsgicors import CORS
from pyramid.config import Configurator, ConfigurationError


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """

    try:
        settings["api.token"] = os.environ["SEMETRIC_API"]
        settings["memcache.password"] = os.environ["MEMCACHEDCLOUD_PASSWORD"]
        settings["memcache.servers"] = os.environ["MEMCACHEDCLOUD_SERVERS"]
        settings["memcache.user"] = os.environ["MEMCACHEDCLOUD_USERNAME"]
    except KeyError as exc:
        raise ConfigurationError("Failed to load config from env: {0}".format(exc))

    config = Configurator(settings=settings)
    config.add_route('augment_chart', '/chart/{id}')
    config.add_route('proxy', '/*url')
    config.scan()

    config.include("hairyoctobear.api")

    registry = config.registry

    registry._cache_region = make_region().configure(
        'dogpile.cache.bmemcached',
        expiration_time = 3600,
        arguments = {
            'url': settings["memcache.servers"].split(),
            'username':settings["memcache.user"],
            'password':settings["memcache.password"]
        }
    )

    registry.get_or_create = registry._cache_region.get_or_create

    return CORS(config.make_wsgi_app(),
                headers="*",
                methods="*",
                maxage="180",
                origin="copy",
                credentials="true")
