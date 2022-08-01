import pytest

from weaverbird.backends.mongo_translator.mongo_pipeline_translator import (  # noqa
    translate_pipeline,
)
from weaverbird.backends.mongo_translator.registry import mongo_registry
from weaverbird.backends.pandas_executor.pipeline_executor import execute_pipeline  # noqa
from weaverbird.backends.pandas_executor.registry import pandas_registry
from weaverbird.backends.pypika_translator import translate  # noqa
from weaverbird.utils.step_registry import _ALL_EXISTING_STEPS, REGISTRY


@pytest.fixture
def all_step_names() -> list[str]:
    return sorted(model.__fields__['name'].default for model in _ALL_EXISTING_STEPS.values())


def test_pandas_supported_steps(all_step_names: list[str]):
    # pandas is supposed to support all steps except custom and customsql
    expected_step_names = sorted(set(all_step_names) - {'custom', 'customsql'})
    assert sorted(pandas_registry().supported_steps().keys()) == expected_step_names


def test_mongo_supported_steps(all_step_names: list[str]):
    # pandas is supposed to support all steps except custom and customsql
    expected_step_names = sorted(
        set(all_step_names) - {'customsql', 'dissolve', 'hierarchy', 'simplify'}
    )
    assert sorted(mongo_registry().supported_steps().keys()) == expected_step_names


def test_pypika_translators_supported_steps(all_step_names: list[str]):
    supported_steps = {
        t: sorted(REGISTRY.registry(t).supported_steps().keys())
        for t in (
            'pypika',
            'pypika-athena',
            'pypika-googlebigquery',
            'pypika-mysql',
            'pypika-postgres',
            'pypika-redshift',
            'pypika-snowflake',
        )
    }

    expected_steps = sorted(
        set(all_step_names)
        - {
            'addmissingdates',
            'cumsum',
            'custom',
            'dissolve',
            'duration',
            'hierarchy',
            'movingaverage',
            'pivot',
            'rank',
            'rollup',
            'simplify',
            'statistics',
            'totals',
            'unpivot',
            'waterfall',
        }
    )

    for translator, steps in supported_steps.items():
        if translator == 'pypika-postgres':
            assert steps == sorted(expected_steps + ['duration'])
        else:
            assert steps == expected_steps
