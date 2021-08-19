from weaverbird.backends.sql_translator.steps.utils.query_transformation import snowflake_date_format


def test_simple_date_format():
    assert ", 'YYYY'" == snowflake_date_format('%Y')
    assert ", 'MON'" == snowflake_date_format('%b')
    assert ", 'MMMM'" == snowflake_date_format('%B')
    assert ", 'YYYY'" == snowflake_date_format('%y')
    assert ", 'MM'" == snowflake_date_format('%M')
    assert ", 'MM'" == snowflake_date_format('%m')
    assert ", 'DD'" == snowflake_date_format('%D')
    assert ", 'DD'" == snowflake_date_format('%d')


def test_complex_date_format():
    assert ", 'DD/MM/YYYY'" == snowflake_date_format('%d/%m/%y')
    assert ", 'YYYY-MM-DD'" == snowflake_date_format('%y-%m-%d')
    assert ", 'MM-YYYY, hh24:mi:ss'" == snowflake_date_format('%m-%y, hh24:mi:ss')


def test_empty_date_format():
    assert "" == snowflake_date_format("")


def test_ignore_none_date_format():
    assert ", 'badaboum'" == snowflake_date_format('badaboum')
