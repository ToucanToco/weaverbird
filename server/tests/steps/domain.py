from unittest.mock import Mock

from weaverbird.steps.domain import DomainStep


def test_retrieve_domain():
    domain_retriever_mock = Mock(return_value='sample_dataframe')

    df = DomainStep(name='domain', domain='kalimdor').execute(
        None, domain_retriever=domain_retriever_mock
    )

    domain_retriever_mock.assert_called_once_with('kalimdor')
    assert df == 'sample_dataframe'
