from unittest.mock import Mock

import pytest

from weaverbird.backends.sql_translator.steps import translate_table
from weaverbird.pipeline.steps import TableStep


@pytest.fixture
def sql_query_describer():
    def f(domain):
        return {'toto': 'integer', 'raichu': 'integer'}

    return f


def test_translate_table(sql_query_describer):
    sql_table_retriever_mock = Mock(
        return_value='SELECT * FROM products'
    )  # TODO update when retrieve_query will be updated

    step = TableStep(name='domain', domain='kalimdor')
    query = translate_table(
        step,
        None,
        sql_query_retriever=sql_table_retriever_mock,
        sql_query_describer=sql_query_describer,
        index=0,
    )

    sql_table_retriever_mock.assert_called_once_with('kalimdor')
    assert query.transformed_query == 'WITH SELECT_STEP_0 AS (SELECT * FROM products)'
    assert query.selection_query == 'SELECT TOTO, RAICHU FROM SELECT_STEP_0'
    assert query.query_name == 'SELECT_STEP_0'


def test_translate_table_error_retrieve_table(sql_query_describer):
    sql_table_retriever_mock = Mock(
        side_effect=Exception
    )  # TODO update when retrieve_query will be updated

    step = TableStep(name='domain', domain='kalimdor')
    with pytest.raises(Exception):
        translate_table(
            step,
            None,
            sql_table_retriever=sql_table_retriever_mock,
            sql_query_describer=sql_query_describer,
            index=0,
        )
