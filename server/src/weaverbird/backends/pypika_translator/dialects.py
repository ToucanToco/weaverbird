from enum import Enum


class SQLDialect(str, Enum):
    ATHENA = "athena"
    GOOGLEBIGQUERY = "googlebigquery"
    MYSQL = "mysql"
    POSTGRES = "postgres"
    REDSHIFT = "redshift"
    SNOWFLAKE = "snowflake"
