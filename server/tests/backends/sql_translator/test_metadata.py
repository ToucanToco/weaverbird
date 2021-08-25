from typing import Dict, List

import pytest

from server.weaverbird.backends.sql_translator.metadata import (
    ColumnMetadata,
    MetadataError,
    SqlQueryMetadataManager,
    TableMetadata,
)


@pytest.fixture
def sql_query_metadata() -> SqlQueryMetadataManager:
    s = SqlQueryMetadataManager()
    t = s.create_table('table_1')
    t.add_column('column_1_1', 'int')
    t.add_column('column_1_2', 'str')
    t.add_column('column_1_3', 'str')
    t.add_column('column_1_4', 'str')

    t = s.create_table('table_2')
    t.add_column('column_2_1', 'int')
    t.add_column('column_2_2', 'str')
    t.add_column('column_2_3', 'str')
    t.add_column('column_2_4', 'str')
    s.define_as_metadata('table_1')
    yield s
    s.remove_tables()


def test_create_table_already_exist(sql_query_metadata):
    with pytest.raises(MetadataError):
        sql_query_metadata.create_table('table_1')


def test_check_current_table(sql_query_metadata):
    table_1: TableMetadata = sql_query_metadata.retrieve_table('table_1')
    table_2: TableMetadata = sql_query_metadata.retrieve_table('table_2')
    assert sql_query_metadata.retrieve_query_metadata().__eq__(table_1)
    assert not sql_query_metadata.retrieve_query_metadata().__eq__(table_2)


def test_update_column_table_not_exist(sql_query_metadata):
    with pytest.raises(MetadataError):
        sql_query_metadata.update_column_name('table_not_exist', 'column_1_1', 'new_column_1_1')


def test_update_column_name_column_not_exist(sql_query_metadata):
    with pytest.raises(MetadataError):
        sql_query_metadata.update_column_name('table_1', 'column_not_exist', 'new_column_1_1')


def test_update_column_name(sql_query_metadata):
    table_1: TableMetadata = sql_query_metadata.retrieve_table('table_1')
    assert 'COLUMN_1_1' in table_1.columns
    assert 'NEW_COLUMN_1_1' not in table_1.columns

    sql_query_metadata.update_column_name('table_1', 'column_1_1', 'new_column_1_1')

    table_1: TableMetadata = sql_query_metadata.retrieve_table('table_1')
    assert 'COLUMN_1_1' not in table_1.columns
    assert 'NEW_COLUMN_1_1' in table_1.columns


def test_update_column_type_table_not_exist(sql_query_metadata):
    with pytest.raises(MetadataError):
        sql_query_metadata.update_column_type('table_not_exist', 'column_1_1', 'str')


def test_update_column_type_column_not_exist(sql_query_metadata):
    with pytest.raises(MetadataError):
        sql_query_metadata.update_column_type('table_1', 'column_not_exist', 'str')


def test_update_column_type(sql_query_metadata):
    table_1: TableMetadata = sql_query_metadata.retrieve_table('table_1')
    assert table_1.retrieve_column_by_column_name('column_1_1').type == 'INT'

    sql_query_metadata.update_column_type('table_1', 'column_1_1', 'str')

    table_1: TableMetadata = sql_query_metadata.retrieve_table('table_1')
    assert table_1.retrieve_column_by_column_name('column_1_1').type == 'STR'


def test_remove_column_table_not_exist(sql_query_metadata):
    with pytest.raises(MetadataError):
        sql_query_metadata.remove_table_column('table_not_exist', 'column_1_1')


def test_remove_column_column_not_exist(sql_query_metadata):
    with pytest.raises(MetadataError):
        sql_query_metadata.remove_table_column('table_1', 'column_not_exist')


def test_remove_column(sql_query_metadata):
    column: ColumnMetadata = sql_query_metadata.retrieve_column_by_name('table_1', 'column_1_1')
    assert isinstance(column, ColumnMetadata)
    sql_query_metadata.remove_table_column('table_1', 'column_1_1')
    column: ColumnMetadata = sql_query_metadata.retrieve_column_by_name('table_1', 'column_1_1')
    assert column is None
    column: ColumnMetadata = sql_query_metadata.retrieve_column_by_name(
        'table_1', 'column_1_1', deleted=True
    )
    assert column.is_delete()


def test_remove_columns_table_not_exist(sql_query_metadata):
    with pytest.raises(MetadataError):
        sql_query_metadata.remove_table_columns('table_not_exist', ['column_1_1', 'column_1_2'])


def test_remove_columns_column_not_exist(sql_query_metadata):
    with pytest.raises(MetadataError):
        sql_query_metadata.remove_table_columns('table_1', ['column_not_exist', 'column_1_2'])


def test_remove_columns(sql_query_metadata):
    column: ColumnMetadata = sql_query_metadata.retrieve_column_by_name('table_1', 'column_1_1')
    assert isinstance(column, ColumnMetadata)
    column2: ColumnMetadata = sql_query_metadata.retrieve_column_by_name('table_1', 'column_1_2')
    assert isinstance(column2, ColumnMetadata)
    sql_query_metadata.remove_table_columns('table_1', ['column_1_1', 'column_1_2'])
    column: ColumnMetadata = sql_query_metadata.retrieve_column_by_name('table_1', 'column_1_1')
    assert column is None
    column: ColumnMetadata = sql_query_metadata.retrieve_column_by_name(
        'table_1', 'column_1_1', deleted=True
    )
    assert column.is_delete()
    column2: ColumnMetadata = sql_query_metadata.retrieve_column_by_name('table_1', 'column_1_2')
    assert column2 is None
    column2: ColumnMetadata = sql_query_metadata.retrieve_column_by_name(
        'table_1', 'column_1_2', deleted=True
    )
    assert column2.is_delete()


def test_remove_all_columns_table_not_exist(sql_query_metadata):
    with pytest.raises(MetadataError):
        sql_query_metadata.remove_table_all_columns('table_not_exist')


def test_remove_all_columns(sql_query_metadata):
    columns: Dict[str, ColumnMetadata] = sql_query_metadata.retrieve_table_columns('table_1')
    assert len(columns) == 4
    i: int = sql_query_metadata.remove_table_all_columns('table_1')
    assert i == 4
    columns: Dict[str, ColumnMetadata] = sql_query_metadata.retrieve_table_columns('table_1')
    assert len(columns) == 0


def test_remove_table_not_exist(sql_query_metadata):
    with pytest.raises(MetadataError):
        sql_query_metadata.remove_table('table_not_exist')


def test_remove_table(sql_query_metadata):
    table1: TableMetadata = sql_query_metadata.retrieve_table('table_1')
    assert isinstance(table1, TableMetadata)
    sql_query_metadata.remove_table('table_1')
    table2: TableMetadata = sql_query_metadata.retrieve_table('table_1')
    assert table2 is None
    table2: TableMetadata = sql_query_metadata.retrieve_table('table_1', deleted=True)
    assert table2.is_delete()


def test_join_query_metadata(sql_query_metadata):
    sql_query_metadata.join_query_metadata('table_2')
    assert len(sql_query_metadata.retrieve_query_metadata_columns()) == 8


def test_retrieve_as_list(sql_query_metadata):
    columns: List[str] = sql_query_metadata.retrieve_columns_as_list(
        'table_1', columns_filter=['column_1_1']
    )
    assert len(columns) == 3
