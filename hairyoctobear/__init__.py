import os
from pyramid.config import Configurator


def main(global_config, **settings):
    """ This function returns a Pyramid WSGI application.
    """
    if "SEMETRIC_API" in os.environ:
        settings["api.token"] = os.environ["SEMETRIC_API"]

    config = Configurator(settings=settings)
    config.add_route('proxy', '/*url')
    config.scan()
    return config.make_wsgi_app()
