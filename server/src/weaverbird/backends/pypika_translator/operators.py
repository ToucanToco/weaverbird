from enum import Enum, auto


class RegexOp(str, Enum):
    REGEXP = "REGEXP"
    SIMILAR_TO = "SIMILAR TO"
    CONTAINS = "CONTAINS"
    REGEXP_LIKE = "REGEXP_LIKE"
    REGEXP_CONTAINS = "REGEXP_CONTAINS"
    NOT_REGEXP_LIKE = "NOT REGEXP_LIKE"
    NOT_REGEXP_CONTAINS = "NOT REGEXP_CONTAINS"


class FromDateOp(Enum):
    DATE_FORMAT = auto()
    TO_CHAR = auto()


class ToDateOp(Enum):
    STR_TO_DATE = auto()
    PARSE_DATE = auto()
    TIMESTAMP = auto()
    TO_TIMESTAMP_NTZ = auto()
