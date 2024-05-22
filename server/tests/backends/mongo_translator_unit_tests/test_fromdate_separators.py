from server.src.weaverbird.backends.mongo_translator.steps.fromdate import _extract_separators_from_date_format

_DATE_FORMAT_WITH_EXPECTED_RESULT = [
    (
        "%d-%b-%Y",
        {
            0: {
                "name": "$_vqbTempDay",
                "position": 0,
                "prefix": "",
            },
            1: {
                "name": "$_vqbTempMonth",
                "position": 3,
                "prefix": "-",
            },
            2: {
                "name": "$_vqbTempYear",
                "position": 6,
                "prefix": "-",
                "suffix": "",
            },
        },
    ),
    (
        "%d %b %Y !",
        {
            0: {
                "name": "$_vqbTempDay",
                "position": 0,
                "prefix": "",
            },
            1: {
                "name": "$_vqbTempMonth",
                "position": 3,
                "prefix": " ",
            },
            2: {
                "name": "$_vqbTempYear",
                "position": 6,
                "prefix": " ",
                "suffix": " !",
            },
        },
    ),
    (
        "%B (month) %d (day)",
        {
            0: {
                "name": "$_vqbTempMonth",
                "position": 0,
                "prefix": "",
            },
            1: {
                "name": "$_vqbTempDay",
                "position": 11,
                "prefix": " (month) ",
                "suffix": " (day)",
            },
        },
    ),
    (
        "Current date: %d/%B",
        {
            0: {
                "name": "$_vqbTempDay",
                "position": 14,
                "prefix": "Current date: ",
            },
            1: {
                "name": "$_vqbTempMonth",
                "position": 17,
                "prefix": "/",
                "suffix": "",
            },
        },
    ),
    ("%B", {0: {"name": "$_vqbTempMonth", "position": 0, "prefix": "", "suffix": ""}}),
]


def test_separators_from_date_format():
    for date_format, expected_result in _DATE_FORMAT_WITH_EXPECTED_RESULT:
        assert _extract_separators_from_date_format(date_format) == expected_result
