from unittest.mock import Mock

from weaverbird.backends.pandas_executor.steps.domain import execute_domain
from weaverbird.pipeline.steps.domain import DomainStep


def test_retrieve_domain():
    domain_retriever_mock = Mock(return_value='sample_dataframe')

    step = DomainStep(name='domain', domain='kalimdor')
    df = execute_domain(step, None, domain_retriever=domain_retriever_mock)

    domain_retriever_mock.assert_called_once_with('kalimdor')
    assert df == 'sample_dataframe'
