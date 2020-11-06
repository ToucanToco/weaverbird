class WeaverbirdError(Exception):
    """Base class for weaverbird exceptions"""


class DuplicateError(WeaverbirdError):
    """Raised when an operation encountered duplicates where it was forbidden"""
