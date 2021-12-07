"""
SQL identifiers can be either unquoted, or quoted.
Unquoted identifiers are tricky, because they are not case-sensitive (i.e. TABLE and table resolves both to the same
element). Also, they can only contain alphanumeric characters, underscores and dollar signs.
Quotes identifier are resolved exactly as they are written, which avoids confusion. Double quotes only are used to
delimit them. Any double quote inside an identifier must be escaped with another double quote.

See https://docs.snowflake.com/en/sql-reference/identifiers-syntax.html
"""


def sql_identifier(name: str) -> str:
    """
    Enclose any string used as an SQL identifier inside double quotes, and escape double quotes
    """
    return '"' + name.replace('"', '""') + '"'
