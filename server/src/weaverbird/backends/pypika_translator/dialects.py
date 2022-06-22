from enum import Enum


class SQLDialect(str, Enum):
    ATHENA = "athena"
    GOOGLEBIGQUERY = "googlebigquery"
    MYSQL = "mysql"
    POSTGRESQL = "postgresql"
    REDSHIFT = "redshift"
    SNOWFLAKE = "snowflake"
