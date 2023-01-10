class SQLTranslationException(Exception):
    """Base exception for SQL translator errors"""


class UnknownTableColumns(SQLTranslationException):
    """Table columns cannot be determined"""


class ForbiddenSQLStep(SQLTranslationException):
    """Forbidden SQL step"""
