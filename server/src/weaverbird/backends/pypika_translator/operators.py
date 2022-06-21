from enum import Enum, auto


class RegexOp(Enum):
    REGEXP = auto()
    SIMILAR_TO = auto()
    CONTAINS = auto()


class FromDateOp(Enum):
    DATE_FORMAT = auto()
    TO_CHAR = auto()


class ToDateOp(Enum):
    TO_DATE = auto()
    STR_TO_DATE = auto()
    PARSE_DATE = auto()
