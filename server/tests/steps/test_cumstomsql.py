import pydantic
import pytest

from weaverbird.pipeline.steps import CustomSqlStep


@pytest.mark.parametrize(
    "query,expected",
    [
        ("SELECT * FROM coucou", "SELECT * FROM coucou"),
        ("SELECT * FROM ##PREVIOUS_STEP##", "SELECT * FROM ##PREVIOUS_STEP##"),
        ("  SELECT * FROM coucou;  ", "SELECT * FROM coucou"),
        ("  SELECT * FROM ##PREVIOUS_STEP##;  ", "SELECT * FROM ##PREVIOUS_STEP##"),
    ],
)
def test_query_sanitization(query: str, expected: str):
    assert CustomSqlStep(query=query).query == expected


@pytest.mark.parametrize(
    "query",
    [
        "SELECT a FROM b; SELECT c FROM d;",
        "  SELECT a FROM b  ; SELECT c FROM d;  ",
    ],
)
def test_query_invalid(query: str):
    with pytest.raises(pydantic.ValidationError):
        CustomSqlStep(query=query)
