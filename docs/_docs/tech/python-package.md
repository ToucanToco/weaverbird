---
title: Python package
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
  - either a `translate_pipeline` function (for _translator backends_),
  - or an `execute_pipeline` function (for _executor backends_).

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
- a `PipelineExecutionReport` with details about time and memory usage for each of its steps.

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

### How to: add a new translator

The only requirement is to create a dedicated sub-package inside the `weaverbird/backends/` directory,
exposing a `translate_pipeline` function, following the signature already explained in the previous
section.

Example of what would look like a basic mongo translator implementing weaverbird's steps
`domain`, `select`, `lowercase` and `join`:

```python
# weaverbird/backends/mongo_translator/__init__.py
from typing import Callable, List
from weaverbird.pipeline import Pipeline, steps


def domain_to_table_identifier(domain_name: str) -> str:
    return domain_name


def translate_pipeline(
    pipeline: Pipeline, domain_to_collection_identifier: Callable
) -> List[dict]:
    """Translate a weaverbird pipeline to a mongo aggregation pipeline"""
    mongo_pipeline = []

    # Iterate on all the steps of the pipeline, and translate them
    # one by one:
    for step in pipeline.steps:

        if isinstance(step, DomainStep):
            mongo_step = {"$match": {"domain": step.domain}}  # specific to toucan toco
            mongo_pipeline.append(mongo_step)

        elif isinstance(step, SelectStep):
            mongo_step = {"$project": {col: 1 for col in step.columns}}
            mongo_pipeline.append(mongo_step)

        elif isinstance(step, LowercaseStep):
            mongo_step = {"$addFields": {step.column: {"$toLower": f'${step.column}'}}}
            mongo_pipeline.append(mongo_step)

        elif isinstance(step, JoinStep):
            mongo_let = {}
            mongo_expr_and = []
            for (left_on, right_on) in step.on:
                mongo_let[slugify(left_on)] = f'${left_on}'
                mongo_expr_and.push(
                    {
                        '$eq': [f'${right_on}', f'$${slugify(left_on)}'],
                    }
                )

            right_domain = step.right_pipeline[0].domain
            right_without_domain = step.right_pipeline[1:]
            right_mongo_pipeline = translate_pipeline(right_without_domain)
            right_mongo_pipeline.append({"$match": {"$expr": {"$and": mongo_expr_and}}})
            mongo_step = {
                "$lookup": {
                    "from": domain_to_collection_identifier(right_domain),
                    "let": mongo_let,
                    "pipeline": right_mongo_pipeline,
                    "as": '_vqbJoinKey',
                },
            }
            mongo_pipeline.append(mongo_step)
            mongo_pipeline.append({'$unwind': '$_vqbJoinKey'})
            mongo_pipeline.append({
                '$replaceRoot': {'newRoot': {'$mergeObjects': ['$_vqbJoinKey', '$$ROOT']}},
            })
            mongo_pipeline.append({'$project': {'_vqbJoinKey': 0}})

        else:
            raise NotImplementedError

    return mongo_pipeline
```

Of course in a real case you would split the work in several functions and files.

#### Test your translator

(work in progress)

For each weaverbird's step, we provide one or several JSON fixtures containing:
- some input data
- the configuration of the step
- the expected output

It is up to you to write a *test executor* which will read the input, execute the step,
and check the output is the one expected.

If your translator does not implement all weaverbird steps, you must declare which one
are supported.

For example, testing a mongo translator would require:
- spawning a mongodb server
- store the input data in a collection
- translate the step with `translate_pipeline`
- run the resulting query against the mongodb collection
- compare the output with the expected one

TODO: show some utils for spawning containers, reading input, comparing ouput

## Playground server

See `playground.py`. It provides a simple server that showcase how to use the module and test it.
