from enum import Enum


class SQLDialect(str, Enum):
    # Note: please use the same translator names than in weaverbird's frontend
    ATHENA = "athena"
    GOOGLEBIGQUERY = "google-big-query"
    MYSQL = "mysql"
    POSTGRES = "postgresql"
    REDSHIFT = "redshift"
    SNOWFLAKE = "snowflake"
