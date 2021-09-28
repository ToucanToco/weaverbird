import pytest

from weaverbird.backends.sql_translator.metadata import ColumnMetadata, SqlQueryMetadataManager
from weaverbird.backends.sql_translator.steps.utils.aggregation import get_aggs_columns
from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    apply_condition,
    build_aggregated_columns,
    build_hierarchical_columns_list,
    build_selection_query,
    build_union_query,
    generate_query_by_keeping_granularity,
    handle_zero_division,
    remove_metadatas_columns_from_query,
    sanitize_column_name,
    sanitize_input,
    snowflake_date_format,
)
from weaverbird.backends.sql_translator.types import SQLQuery
from weaverbird.pipeline.conditions import (
    BaseCondition,
    ComparisonCondition,
    ConditionComboAnd,
    ConditionComboOr,
    InclusionCondition,
    MatchCondition,
    NullCondition,
)
from weaverbird.pipeline.steps import AggregateStep
from weaverbird.pipeline.steps.aggregate import Aggregation


@pytest.fixture
def query():
    return SQLQuery(
        query_name='SELECT_STEP_0',
        transformed_query='WITH SELECT_STEP_0 AS (SELECT * FROM products)',
        selection_query='SELECT * FROM SELECT_STEP_0',
        metadata_manager=SqlQueryMetadataManager(
            tables_metadata={
                'table1': {
                    'Value1': 'int',
                    'Label': 'text',
                    'Group': 'text',
                },
            },
        ),
    )


@pytest.fixture
def aggregations(mocker):
    return [
        mocker.MagicMock(
            columns=['ENRON', 'STANDARD OIL'],
            agg_function='SUM',
            new_columns=['SUM_ENRON', 'SUM_STANDARD_OIL'],
        ),
        mocker.MagicMock(columns=['ARAMCO'], agg_function='AVG', new_columns=['MOAAAR_OIL']),
    ]


class FakeStep:
    def __init__(self, hierarchy, aggregations, level_col, label_col, parent_label_col, groupby):
        self.hierarchy = hierarchy
        self.aggregations = aggregations
        self.level_col = level_col
        self.label_col = label_col
        self.parent_label_col = parent_label_col
        self.groupby = groupby


def test_apply_condition_comparisons():
    assert (
        apply_condition(
            ComparisonCondition(column='amount', operator='eq', value=10),
            query='SELECT product FROM inventory WHERE ',
        )
        == 'SELECT product FROM inventory WHERE amount = 10'
    )

    assert (
        apply_condition(
            ComparisonCondition(column='amount', operator='ne', value=10),
            query='SELECT product FROM inventory WHERE ',
        )
        == 'SELECT product FROM inventory WHERE amount != 10'
    )

    assert (
        apply_condition(
            ComparisonCondition(column='amount', operator='lt', value=10),
            query='SELECT product FROM inventory WHERE ',
        )
        == 'SELECT product FROM inventory WHERE amount < 10'
    )

    assert (
        apply_condition(
            ComparisonCondition(column='amount', operator='le', value=10),
            query='SELECT product FROM inventory WHERE ',
        )
        == 'SELECT product FROM inventory WHERE amount <= 10'
    )

    assert (
        apply_condition(
            ComparisonCondition(column='amount', operator='gt', value=10),
            query='SELECT product FROM inventory WHERE ',
        )
        == 'SELECT product FROM inventory WHERE amount > 10'
    )

    assert (
        apply_condition(
            ComparisonCondition(column='amount', operator='ge', value=10),
            query='SELECT product FROM inventory WHERE ',
        )
        == 'SELECT product FROM inventory WHERE amount >= 10'
    )

    assert (
        apply_condition(
            ComparisonCondition(column='amount', operator='ge', value='blabla'),
            query='SELECT product FROM inventory WHERE ',
        )
        == "SELECT product FROM inventory WHERE amount >= 'blabla'"
    )


def test_apply_condition_nullity():
    assert (
        apply_condition(
            NullCondition(column='origin', operator='isnull'),
            query='SELECT product FROM inventory WHERE ',
        )
        == 'SELECT product FROM inventory WHERE origin IS NULL'
    )
    assert (
        apply_condition(
            NullCondition(column='origin', operator='notnull'),
            query='SELECT product FROM inventory WHERE ',
        )
        == 'SELECT product FROM inventory WHERE origin IS NOT NULL'
    )


def test_apply_condition_match():
    assert (
        apply_condition(
            MatchCondition(column='origin', operator='matches', value='^f.*'),
            query='SELECT product FROM inventory WHERE ',
        )
        == "SELECT product FROM inventory WHERE origin RLIKE '^f.*'"
    )
    assert (
        apply_condition(
            MatchCondition(column='origin', operator='notmatches', value='^f.*'),
            query='SELECT product FROM inventory WHERE ',
        )
        == "SELECT product FROM inventory WHERE origin NOT RLIKE '^f.*'"
    )


def test_apply_condition_inclusion():
    assert (
        apply_condition(
            InclusionCondition(column='origin', operator='in', value=['france', 'spain', 'italy']),
            query='SELECT product FROM inventory WHERE ',
        )
        == "SELECT product FROM inventory WHERE origin IN ('france', 'spain', 'italy')"
    )
    assert (
        apply_condition(
            InclusionCondition(column='origin', operator='nin', value=['france', 'spain', 'italy']),
            query='SELECT product FROM inventory WHERE ',
        )
        == "SELECT product FROM inventory WHERE origin NOT IN ('france', 'spain', 'italy')"
    )


def test_apply_condition_conditioncomboand():
    assert (
        apply_condition(
            ConditionComboAnd(
                and_=[
                    ComparisonCondition(column='amount', operator='gt', value=10),
                    MatchCondition(column='origin', operator='matches', value='^france'),
                    InclusionCondition(
                        column='type', operator='nin', value=['meat', 'vegetables', 'corn']
                    ),
                ]
            ),
            query='SELECT product FROM inventory WHERE ',
        )
        == "SELECT product FROM inventory WHERE amount > 10 AND origin RLIKE '^france' AND type NOT IN ('meat', "
        "'vegetables', 'corn')"
    )


def test_apply_condition_conditioncomboor():
    assert (
        apply_condition(
            ConditionComboOr(
                or_=[
                    ComparisonCondition(column='amount', operator='gt', value=10),
                    MatchCondition(column='origin', operator='matches', value='^fra.*'),
                    InclusionCondition(
                        column='type', operator='nin', value=['meat', 'vegetables', 'corn']
                    ),
                ]
            ),
            query='SELECT product FROM inventory WHERE ',
        )
        == "SELECT product FROM inventory WHERE amount > 10 OR origin RLIKE '^fra.*' OR type NOT IN ('meat', "
        "'vegetables', 'corn')"
    )


def test_apply_not_implemented():
    class FakeCondition(BaseCondition):
        ...

    with pytest.raises(NotImplementedError):
        apply_condition(FakeCondition(), query='coucou')


def test_build_selection_query():
    assert (
        build_selection_query({'toto': ColumnMetadata(name='toto', type='tata')}, 'SELECT_STEP_0')
        == 'SELECT TOTO FROM SELECT_STEP_0'
    )


def test_build_selection_query_empty_cols():
    assert build_selection_query({}, 'SELECT_STEP_0') == 'SELECT  FROM SELECT_STEP_0'


def test_handle_zero_division_no_division():
    assert handle_zero_division('AGE - YEAR + 2000') == 'AGE - YEAR + 2000'


def test_handle_zero_division_only_div():
    assert (
        handle_zero_division('1 / PIPEAU / "BLA    BLA"')
        == '1 / NULLIF(PIPEAU, 0) / NULLIF("BLA    BLA", 0)'
    )


def test_handle_zero_division_only_modulo():
    assert (
        handle_zero_division('1 % PIPEAU % "BLA    BLA"')
        == '1 % NULLIF(PIPEAU, 0) % NULLIF("BLA    BLA", 0)'
    )


def test_handle_zero_division_modulo_and_div():
    assert (
        handle_zero_division('1 % PIPEAU / "BLA    BLA"')
        == '1 % NULLIF(PIPEAU, 0) / NULLIF("BLA    BLA", 0)'
    )


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
    assert '' == snowflake_date_format('')


def test_ignore_none_date_format():
    assert ", 'badaboum'" == snowflake_date_format('badaboum')


def test_build_union_query():
    s = SqlQueryMetadataManager()
    t = s.create_table('table_1')
    t.add_column('column_1_1', 'int')
    t.add_column('column_1_2', 'text')
    t.add_column('column_1_3', 'text')
    t.add_column('column_1_4', 'text')

    t = s.create_table('table_2')
    t.add_column('column_2_1', 'int')
    t.add_column('column_2_2', 'text')
    t.add_column('column_2_3', 'text')
    t.add_column('column_2_4', 'text')
    s.define_as_metadata('table_1')
    s.append_queries_metadata(['table_2'])
    res = build_union_query(s, 'SELECT_STEP_0', ['table_2'])
    assert (
        res
        == """SELECT COLUMN_1_1, COLUMN_1_2, COLUMN_1_3, COLUMN_1_4 FROM SELECT_STEP_0 UNION ALL SELECT\
 COLUMN_2_1, COLUMN_2_2, COLUMN_2_3, COLUMN_2_4 FROM table_2"""
    )


def test_build_union_query_first_smaller():
    s = SqlQueryMetadataManager()
    t = s.create_table('table_1')
    t.add_column('column_1_1', 'int')
    t.add_column('column_1_2', 'text')
    t.add_column('column_1_3', 'text')

    t = s.create_table('table_2')
    t.add_column('column_2_1', 'int')
    t.add_column('column_2_2', 'text')
    t.add_column('column_2_3', 'text')
    t.add_column('column_2_4', 'text')
    s.define_as_metadata('table_1')
    s.append_queries_metadata(['table_2'])
    res = build_union_query(s, 'SELECT_STEP_0', ['table_2'])
    assert (
        res
        == """SELECT COLUMN_1_1, COLUMN_1_2, COLUMN_1_3, NULL AS COLUMN_2_4 FROM SELECT_STEP_0 UNION ALL SELECT\
 COLUMN_2_1, COLUMN_2_2, COLUMN_2_3, COLUMN_2_4 FROM table_2"""
    )


def test_build_union_query_second_smaller():
    s = SqlQueryMetadataManager()
    t = s.create_table('table_1')
    t.add_column('column_1_1', 'int')
    t.add_column('column_1_2', 'text')
    t.add_column('column_1_3', 'text')
    t.add_column('column_1_4', 'text')

    t = s.create_table('table_2')
    t.add_column('column_2_1', 'int')
    t.add_column('column_2_2', 'text')
    t.add_column('column_2_3', 'text')
    s.define_as_metadata('table_1')
    s.append_queries_metadata(['table_2'])
    res = build_union_query(s, 'SELECT_STEP_0', ['table_2'])
    assert (
        res
        == """SELECT COLUMN_1_1, COLUMN_1_2, COLUMN_1_3, COLUMN_1_4 FROM SELECT_STEP_0 UNION ALL SELECT\
 COLUMN_2_1, COLUMN_2_2, COLUMN_2_3, NULL FROM table_2"""
    )


def test_sanitize_input():
    assert sanitize_input('bla') == 'bla'
    assert sanitize_input("bla'") == "bla\\'"
    assert sanitize_input('bla"') == 'bla\\"'


def test_sanitize_column_name():
    assert sanitize_column_name('bla') == 'bla'
    assert sanitize_column_name("bla'") == 'bla_'
    assert sanitize_column_name('bla"') == 'bla_'
    assert sanitize_column_name('1bla') == '_1bla'
    assert sanitize_column_name('€bla') == '_bla'
    assert sanitize_column_name('./§PL%L121R0°I"""$$"' '""€€') == '___PL_L121R0_I___$$_____'


def test_remove_metadatas_columns_from_query(query):
    query_with_metadatas_removed = remove_metadatas_columns_from_query(
        query,
        array_cols=["TOTO"],
        first_last_string="SOME SQL QUERY HERE FOR FIRST AND LAST",
        first_or_last_aggregate=True,
    )
    assert (
        query_with_metadatas_removed[0].transformed_query
        == "WITH SELECT_STEP_0 AS (SELECT * FROM products)"
    )
    assert (
        query_with_metadatas_removed[1]
        == "SELECT TOTO FROM (SOME SQL QUERY HERE FOR FIRST AND LAST)"
    )


def test_get_aggs_columns(query):
    step = AggregateStep(
        name='aggregate',
        on=['category'],
        aggregations=[
            Aggregation(aggfunction='first', columns=['Label'], newcolumns=['first_label']),
            Aggregation(aggfunction='last', columns=['title'], newcolumns=['last_title']),
            Aggregation(aggfunction='sum', columns=['group'], newcolumns=['sum_group']),
        ],
        keep_original_granularity=True,
    )
    assert get_aggs_columns(step) == [
        ('Label', 'first_label'),
        ('title', 'last_title'),
        ('group', 'sum_group'),
    ]

    assert get_aggs_columns(step, "first") == [('Label', 'first_label')]

    assert get_aggs_columns(step, "last") == [('title', 'last_title')]


def test_generate_query_by_keeping_granularity(query):
    query_with_granularity_kept = generate_query_by_keeping_granularity(
        query,
        group_by=["TOTO", "RAICHU"],
        current_step_name="STEP_X",
        query_to_complete="",
        aggregated_cols=None,
        group_by_except_target_columns=None,
    )
    assert query_with_granularity_kept[0].metadata_manager.retrieve_query_metadata_columns() == {
        'GROUP': ColumnMetadata(
            name='GROUP',
            original_name='Group',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'LABEL': ColumnMetadata(
            name='LABEL',
            original_name='Label',
            type='TEXT',
            original_type='text',
            alias=None,
            delete=False,
        ),
        'VALUE1': ColumnMetadata(
            name='VALUE1',
            original_name='Value1',
            type='INT',
            original_type='int',
            alias=None,
            delete=False,
        ),
    }
    assert query_with_granularity_kept[1] == (
        "SELECT * FROM (SELECT TOTO AS TOTO_ALIAS_0, RAICHU AS RAICHU_ALIAS_1 "
        "FROM SELECT_STEP_0 GROUP BY TOTO_ALIAS_0, RAICHU_ALIAS_1) STEP_X_ALIAS "
        "INNER JOIN (SELECT *, ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS "
        "TO_REMOVE_STEP_X FROM SELECT_STEP_0) SELECT_STEP_0_ALIAS ON (("
        "TOTO_ALIAS_0 = SELECT_STEP_0_ALIAS.TOTO) AND (RAICHU_ALIAS_1 = "
        "SELECT_STEP_0_ALIAS.RAICHU)) ORDER BY TO_REMOVE_STEP_X"
    )
    assert query_with_granularity_kept[2] == []


def test_build_aggregated_columns(aggregations):
    assert build_aggregated_columns(aggregations) == [
        "SUM(ENRON) AS SUM_ENRON",
        "SUM(STANDARD OIL) AS SUM_STANDARD_OIL",
        "AVG(ARAMCO) AS MOAAAR_OIL",
    ]


def test_build_aggregated_columns_empty(mocker):
    aggregations = [
        mocker.MagicMock(columns=[], agg_function='', new_columns=[]),
    ]
    assert build_aggregated_columns(aggregations) == []


def test_build_hierarchical_columns_list(aggregations):
    step = FakeStep(
        hierarchy=['EXXON', 'CHEVRON', 'TEXACO'],
        aggregations=aggregations,
        level_col='ROCKFELLER',
        label_col='CFP',
        parent_label_col='ANGLO-PERSIAN OIL COMPANY',
        groupby=['SAUDI ARABIA', 'IRAN'],
    )
    assert (
        build_hierarchical_columns_list(step)
        == """EXXON, CHEVRON, TEXACO, SAUDI ARABIA, IRAN, COALESCE(TEXACO, CHEVRON, EXXON) AS CFP, \
CASE WHEN TEXACO IS NOT NULL THEN 'TEXACO' WHEN CHEVRON IS NOT NULL THEN 'CHEVRON' WHEN EXXON \
IS NOT NULL THEN 'EXXON' ELSE '' END AS ROCKFELLER, CASE WHEN ROCKFELLER = 'CHEVRON' THEN "EXXON" \
WHEN ROCKFELLER = 'TEXACO' THEN "CHEVRON" ELSE NULL END AS ANGLO-PERSIAN OIL COMPANY, SUM(ENRON) \
AS SUM_ENRON, SUM(STANDARD OIL) AS SUM_STANDARD_OIL, AVG(ARAMCO) AS MOAAAR_OIL"""
    )
