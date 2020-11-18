import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps import AppendStep
from weaverbird.types import DomainRetriever, PipelineExecutor


@pytest.fixture
def sample_df():
    return DataFrame({'name': ['foo', 'bar'], 'age': [42, 43], 'score': [100, 200]})


@pytest.fixture
def mock_execute_pipeline() -> PipelineExecutor:
    return lambda p: DataFrame({'name': ['plop'], 'score': [666], 'x': ['y']})


@pytest.fixture
def mock_domain_retriever() -> PipelineExecutor:
    return lambda p: DataFrame({'name': ['miam'], 'score': [999], 'lambda': ['p']})


def test_append(
    sample_df: DataFrame,
    mock_domain_retriever: DomainRetriever,
    mock_execute_pipeline: PipelineExecutor,
):
    df_result = AppendStep(name='append', pipelines=[[{}], [{}]],).execute(
        sample_df, domain_retriever=mock_domain_retriever, execute_pipeline=mock_execute_pipeline
    )

    expected_result = DataFrame(
        {
            'name': ['foo', 'bar', 'plop', 'plop'],
            'age': [42, 43, None, None],
            'score': [100, 200, 666, 666],
            'x': [None, None, 'y', 'y'],
        }
    )
    assert_dataframes_equals(df_result, expected_result)


def test_append_with_domain_name(
    sample_df: DataFrame,
    mock_domain_retriever: DomainRetriever,
    mock_execute_pipeline: PipelineExecutor,
):
    """
    It should accept a domain name instead of a complete pipeline
    """
    df_result = AppendStep(name='append', pipelines=['miam'],).execute(
        sample_df, domain_retriever=mock_domain_retriever, execute_pipeline=mock_execute_pipeline
    )

    expected_result = DataFrame(
        {
            'name': ['foo', 'bar', 'miam'],
            'age': [42, 43, None],
            'score': [100, 200, 999],
            'lambda': [None, None, 'p'],
        }
    )
    assert_dataframes_equals(df_result, expected_result)
