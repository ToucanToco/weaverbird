import pytest
from weaverbird.pipeline.formula_ast import utils


@pytest.mark.parametrize(
    "input,expected,escape",
    [
        ("coucou", "coucou", True),
        ('"coucou"', "coucou", True),
        ("'coucou'", "coucou", True),
        ("'coucou", r"\'coucou", True),
        ('coucou"', r"coucou\"", True),
        ("cou'cou'c'o'", r"cou\'cou\'c\'o\'", True),
        ("""cou'"co"u'c'o'""", r"""cou\'\"co\"u\'c\'o\'""", True),
        ("coucou", "coucou", False),
        ('"coucou"', "coucou", False),
        ("'coucou'", "coucou", False),
        ("'coucou", "'coucou", False),
        ('coucou"', 'coucou"', False),
        ("cou'cou'c'o'", "cou'cou'c'o'", False),
        ("""cou'"co"u'c'o'""", """cou'"co"u'c'o'""", False),
    ],
)
def test_unquote_string(input: str, expected: str, escape: bool):
    assert utils.unquote_string(input, escape_quotes=escape) == expected
    # Checking idempotency
    s = input
    # doing that in range(5)
    for _ in range(5):
        s = utils.unquote_string(s, escape_quotes=escape)
    assert s == expected
