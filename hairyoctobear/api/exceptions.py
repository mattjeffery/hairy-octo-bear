"""
    API Error classes
"""


class APIError(Exception):
    __message__ = "Internal Server Error"
    __code__ = 500

    def __init__(self, code=None, message=None):
        self.code = code or self.__code__
        self.message = message or self.__message__

    @classmethod
    def from_exception(cls, exc):
        return cls(code=500, message=str(exc))

    @property
    def error(self):
        return {"msg": self.message, "code": self.code}

    def __str__(self):
        return unicode(self).encode("utf8")

    def __unicode__(self):
        return "%s(code=%r, message=%r)"\
            % (self.__class__.__name__,
               self.code,
               self.message)


class APINotFound(APIError):
    __message__ = "Resource not found"
    __code__ = 404


class APINoData(APIError):
    __message__ = "No data found"
    __code__ = 204

