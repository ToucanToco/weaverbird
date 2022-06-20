class WeaverbirdError(Exception):
    """Base class for weaverbird exceptions"""


class DuplicateError(WeaverbirdError):
    """Raised when an operation encountered duplicates where it was forbidden"""


class DuplicateColumnError(Exception):
    """raised when duplicate column names in input"""


class UnresolvedReferenceError(Exception):
    """Raised when a join step as a reference instead of a pipeline in input"""


class MissingColumnNameError(WeaverbirdError):
    """Raised when defining a substring but did not supply a new column name"""


class MissingTableNameError(WeaverbirdError):
    """Raised when defining a custom SQL query but didn't set a proper temporary table name"""
