import pytest
from weaverbird.backends.pypika_translator.translators import (
    AthenaTranslator,
    GoogleBigQueryTranslator,
    MySQLTranslator,
    PostgreSQLTranslator,
    RedshiftTranslator,
    SnowflakeTranslator,
)


@pytest.mark.parametrize(
    "input,expected",
    [
        ("%Y-%m-%d", "YYYY-MM-DD"),
        ("%d/%m/%Y", "DD/MM/YYYY"),
        ("%d %b %Y", "DD Mon YYYY"),
        ("%d %B %Y", "DD FMMonth YYYY"),
    ],
)
def test_adapt_date_format_postgresql(input: str, expected: str):
    assert PostgreSQLTranslator._adapt_date_format(input) == expected


@pytest.mark.parametrize(
    "input,expected",
    [
        ("%Y-%m-%d", "%Y-%m-%d"),
        ("%d/%m/%Y", "%d/%m/%Y"),
        ("%d %b %Y", "%d %b %Y"),
        ("%d %B %Y", "%d %M %Y"),
    ],
)
def test_adapt_date_format_mysql(input: str, expected: str):
    assert MySQLTranslator._adapt_date_format(input) == expected


@pytest.mark.parametrize(
    "input,expected",
    [
        ("%Y-%m-%d", "%Y-%m-%d"),
        ("%d/%m/%Y", "%d/%m/%Y"),
        ("%d %b %Y", "%d %b %Y"),
        ("%d %B %Y", "%d %B %Y"),
    ],
)
def test_adapt_date_format_gbq(input: str, expected: str):
    assert GoogleBigQueryTranslator._adapt_date_format(input) == expected


@pytest.mark.parametrize(
    "input,expected",
    [
        ("%Y-%m-%d", "YYYY-MM-DD"),
        ("%d/%m/%Y", "DD/MM/YYYY"),
        ("%d %b %Y", "DD Mon YYYY"),
        ("%d %B %Y", "DD FMMonth YYYY"),
    ],
)
def test_adapt_date_format_redshift(input: str, expected: str):
    assert RedshiftTranslator._adapt_date_format(input) == expected


@pytest.mark.parametrize(
    "input,expected",
    [
        ("%Y-%m-%d", "YYYY-MM-DD"),
        ("%d/%m/%Y", "DD/MM/YYYY"),
        ("%d %b %Y", "DD MON YYYY"),
        ("%d %B %Y", "DD MON YYYY"),
    ],
)
def test_adapt_date_format_snowflake(input: str, expected: str):
    assert SnowflakeTranslator._adapt_date_format(input) == expected


@pytest.mark.parametrize(
    "input,expected",
    [
        ("%Y-%m-%d", "%Y-%m-%d"),
        ("%d/%m/%Y", "%d/%m/%Y"),
        ("%d %b %Y", "%d %b %Y"),
        ("%d %B %Y", "%d %M %Y"),
    ],
)
def test_adapt_date_format_athena(input: str, expected: str):
    assert AthenaTranslator._adapt_date_format(input) == expected
