import numpy as np
import pytest
from pandas import DataFrame

from tests.utils import assert_dataframes_equals
from weaverbird.steps import JoinStep
from weaverbird.types import DomainRetriever, PipelineExecutor


@pytest.fixture
def sample_df():
    return DataFrame({'NAME': ['foo', 'bar'], 'AGE': [42, 43]})


@pytest.fixture
def mock_execute_pipeline() -> PipelineExecutor:
    return lambda p: DataFrame({'name': ['bar', 'baz'], 'score': [100, 200]})


@pytest.fixture
def mock_domain_retriever() -> DomainRetriever:
    return lambda p: DataFrame({'name': ['bar', 'baz'], 'score': [1, 2]})


def test_join_left(
    sample_df: DataFrame,
    mock_domain_retriever: DomainRetriever,
    mock_execute_pipeline: PipelineExecutor,
):
    df_result = JoinStep(
        name='join',
        right_pipeline=[{'name': 'domain', 'domain': 'buzz'}],
        on=[
            ['NAME', 'name'],
        ],
        type='left',
    ).execute(
        sample_df, domain_retriever=mock_domain_retriever, execute_pipeline=mock_execute_pipeline
    )

    expected_result = DataFrame(
        {'NAME': ['foo', 'bar'], 'name': [None, 'bar'], 'AGE': [42, 43], 'score': [None, 100]}
    )
    assert_dataframes_equals(df_result, expected_result)


def test_join_outer(
    sample_df: DataFrame,
    mock_domain_retriever: DomainRetriever,
    mock_execute_pipeline: PipelineExecutor,
):
    df_result = JoinStep(
        name='join',
        right_pipeline=[{'name': 'domain', 'domain': 'buzz'}],
        on=[
            ['NAME', 'name'],
        ],
        type='left outer',
    ).execute(
        sample_df, domain_retriever=mock_domain_retriever, execute_pipeline=mock_execute_pipeline
    )

    expected_result = DataFrame(
        {
            'NAME': ['foo', 'bar', None],
            'name': [None, 'bar', 'baz'],
            'AGE': [42, 43, None],
            'score': [None, 100, 200],
        }
    )
    assert_dataframes_equals(df_result, expected_result)


def test_join_inner(
    sample_df: DataFrame,
    mock_domain_retriever: DomainRetriever,
    mock_execute_pipeline: PipelineExecutor,
):
    df_result = JoinStep(
        name='join',
        right_pipeline=[{'name': 'domain', 'domain': 'buzz'}],
        on=[
            ['NAME', 'name'],
        ],
        type='inner',
    ).execute(
        sample_df, domain_retriever=mock_domain_retriever, execute_pipeline=mock_execute_pipeline
    )

    expected_result = DataFrame(
        {
            'NAME': ['bar'],
            'name': ['bar'],
            'AGE': [43],
            'score': [100],
        }
    )
    assert_dataframes_equals(df_result, expected_result)


def test_join_domain_name(
    sample_df: DataFrame,
    mock_domain_retriever: DomainRetriever,
    mock_execute_pipeline: PipelineExecutor,
):
    """
    It should accept a domain name instead of a complete pipeline
    """
    df_result = JoinStep(
        name='join',
        right_pipeline='plop',
        on=[
            ['NAME', 'name'],
        ],
        type='left',
    ).execute(
        sample_df, domain_retriever=mock_domain_retriever, execute_pipeline=mock_execute_pipeline
    )

    expected_result = DataFrame(
        {'NAME': ['foo', 'bar'], 'name': [None, 'bar'], 'AGE': [42, 43], 'score': [None, 1]}
    )
    assert_dataframes_equals(df_result, expected_result)


def test_benchmark_join(benchmark):
    left_df = DataFrame({'value': np.random.random(1000), 'id': list(range(1000))})
    right_df = DataFrame({'value': np.random.random(1000), 'id': list(range(1000))})

    def domain_retriever(p):
        return right_df

    step = JoinStep(
        name='join',
        right_pipeline=[{'name': 'domain', 'domain': 'buzz'}],
        on=[
            ['id', 'id'],
        ],
        type='left',
    )

    benchmark(step.execute, left_df, domain_retriever, domain_retriever)
