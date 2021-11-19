import pytest

from weaverbird.backends.sql_translator.metadata import ColumnMetadata
from weaverbird.backends.sql_translator.steps import translate_fillna
from weaverbird.pipeline.steps import FillnaStep


def test_translate_fillna(query):
    step = FillnaStep(name='fillna', columns=['RAICHU'], value='ZorG')
    res = translate_fillna(
        step,
        query,
        index=1,
    )
    assert (
        res.transformed_query
        == "WITH SELECT_STEP_0 AS (SELECT * FROM products), FILLNA_STEP_1 AS (SELECT TOTO, FLORIZARRE, IFNULL(RAICHU, \
'ZorG') AS RAICHU FROM SELECT_STEP_0)"
    )
    assert res.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM FILLNA_STEP_1'
    assert res.query_name == 'FILLNA_STEP_1'
    assert res.metadata_manager.retrieve_query_metadata_columns() == {
        'FLORIZARRE': ColumnMetadata(
            name='FLORIZARRE',
            original_name='FLORIZARRE',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'RAICHU': ColumnMetadata(
            name='RAICHU',
            original_name='RAICHU',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
        'TOTO': ColumnMetadata(
            name='TOTO',
            original_name='TOTO',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
    }


def test_translate_fillna_int(query):
    step = FillnaStep(name='fillna', columns=['RAICHU'], value=1)
    res = translate_fillna(
        step,
        query,
        index=1,
    )
    assert (
        res.transformed_query
        == 'WITH SELECT_STEP_0 AS (SELECT * FROM products), FILLNA_STEP_1 AS (SELECT TOTO, FLORIZARRE, IFNULL(RAICHU, \
1) AS RAICHU FROM SELECT_STEP_0)'
    )
    assert res.selection_query == 'SELECT TOTO, RAICHU, FLORIZARRE FROM FILLNA_STEP_1'
    assert res.query_name == 'FILLNA_STEP_1'
    assert res.metadata_manager.retrieve_query_metadata_columns() == {
        'FLORIZARRE': ColumnMetadata(
            name='FLORIZARRE',
            original_name='FLORIZARRE',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'RAICHU': ColumnMetadata(
            name='RAICHU',
            original_name='RAICHU',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
        'TOTO': ColumnMetadata(
            name='TOTO',
            original_name='TOTO',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
    }


def test_translate_fillna_error(query, mocker):
    step = FillnaStep(name='fillna', columns=['RAICHU'], value='ZorG')
    mocker.patch(
        'weaverbird.backends.sql_translator.steps.fillna.build_selection_query',
        side_effect=Exception,
    )

    with pytest.raises(Exception):
        translate_fillna(
            step,
            query,
            index=1,
        )
