"""
    Custom tweens for LegionII
"""

import logging
try:
    import json
except ImportError:
    import simplejson as json  # pylint: disable=W801


import pyramid.tweens
from pyramid.renderers import JSONP
from hairyoctobear.api.wrapper import APIWrapper

log = logging.getLogger(__name__)


def includeme(config):
    """
        Setup all the API handling
    """
    registry = config.registry

    registry._api_wrapper = APIWrapper()
    registry._jsonp_render = JSONP(param_name='callback', serializer=registry._api_wrapper)

    config.add_tween('hairyoctobear.api.wrapper:api_exception_tween_factory', over=pyramid.tweens.EXCVIEW)

    # Add the JSONP renderer
    config.add_renderer('jsonp', registry._jsonp_render)
    config.add_notfound_view(APIWrapper.not_found, renderer='jsonp')
