---
title: Python
permalink: /docs/python-package/
---

# Weaverbird [python package](https://pypi.org/project/weaverbird/)

The python module provide a way to turn pipelines into transformation functions or queries.


## Purpose

This package is meant as a building block to create servers capable of understanding and executing such pipelines, and returning results to clients.
It provides several ways to understand and run weaverbird's pipelines, called _backends_.

_Backends_ can either provide:
- a way to execute pipelines directly (let's call them _executor backends_).
- a way to translate pipelines into queries meant to be run against a database (let's call them _translator backends_).


## Installation

`pip install weaverbird`


## Usage

:warning: This doc is provisional, implementation pending

The package exposes:
- a [pydantic](https://pydantic-docs.helpmanual.io/) model `Pipeline` which mirror the pipeline definition used by the front-end
- several `weaverbird.backends.xxxx` sub-modules, each exposing:
  - either a `translate_pipeline` function (for _executor backends_),
  - or an `execute_pipeline` function (for _translator backends_).

### `Pipeline` model: validation

Using the pydantic model, one can validate that a series of pipeline steps are valid:
```python
from weaverbird.pipeline import Pipeline

pipeline_steps = [{'name': 'domain', 'domain': 'example'}]

pipeline = Pipeline(steps=pipeline_steps)
```

A `ValidationError` is raised when the provided steps are not valid:
```python
> Pipeline()

ValidationError: 1 validation error for Pipeline
steps
  field required (type=value_error.missing)

> Pipeline([{'name': 'domain', 'domain': 'example'}, {'name': 'invalid'}])

ValidationError: 130 validation errors for Pipeline
steps -> 1 -> name
  unexpected value; permitted: 'addmissingdates' (type=value_error.const; given=invalid; permitted=['addmissingdates'])
[...]
```

### Executor backends: execute a pipeline

```python
import pandas as pd
from weaverbird.backends.pandas_executor import execute_pipeline

def domain_retriever(domain_name: str) -> pd.DataFrame:
    return pd.read_csv(f'./datasets/{domain_name}.csv')

pipeline = [
  {'name': 'domain', 'domain': 'example'},
  {'name': 'filter', 'condition': {
    'column': 'planet',
    'operator': 'eq',
    'value': 'Earth',
  }}
]

execute_pipeline(pipeline, domain_retriever)
```

where:
- `pipeline` is an instance of the `Pipeline` model
- `domain_retriever` is a function that, from an identifier, returns a corresponding `panda`'s `DataFrame` 

The result of `execute_pipeline` is a tuple formed by:
- the transformed `DataFrame`,
- a `PipelineExecutionReport` with details about time and memory usage each of its steps.

As of today, only one executor backend exists for python, based on pandas.

### Translator backends: translate a pipeline into a query

```python
from weaverbird.backends.sqlite_translator import translate_pipeline

def domain_to_table_identifier(domain_name: str) -> str:
    return domain_name

pipeline = [
  {'name': 'domain', 'domain': 'example'},
  {'name': 'filter', 'condition': {
    'column': 'planet',
    'operator': 'eq',
    'value': 'Earth',
  }}
]

translate_pipeline(pipeline, domain_to_table_identifier)
# SELECT * FROM example WHERE planet='Earth'
```

where:
- `pipeline` is an instance of the `Pipeline` model
- `domain_to_table_identifier` is an optional function that, from an identifier, returns the corresponding identifier of the table in the targeted database

The result of `translate_pipeline` is a query, generally a `str` (but other types could be possible, like a `list` or `dict` for MongoDB queries).

As of today, no translator backend exists for python. We plan to implement one for MongoDB, and one for Snowflake SQL.


## Playground server

See `playground.py`. It provides a simple server that showcase how to use the module and test it.
