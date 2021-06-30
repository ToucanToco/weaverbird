---
title: Python
permalink: /docs/python-package/
---

# Weaverbird [python package](https://pypi.org/project/weaverbird/)

The python module provide a way to run transformations described in a pipeline.

## Purpose

This package provides utility functions to translate weaverbird's pipelines into Python functions, powered by [pandas](https://pandas.pydata.org/).
It is meant as a building block to create servers capable of understanding and executing such pipelines, and returning results to clients.

## Installation

`pip install weaverbird`

## Usage

The package exposes:
- a [pydantic](https://pydantic-docs.helpmanual.io/) model `Pipeline` which mirror the pipeline definition used by the front-end
- a `PipelineExcutor` class to turn pipelines into transformation functions

### Validate a pipeline

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

### Execute a pipeline

```python
import pandas as pd
from weaverbird.pipeline_executor import PipelineExecutor

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

executor = PipelineExecutor(domain_retriever)
executor.execute_pipeline(pipeline)
```

where:
- `pipeline` is an instance of the `Pipeline` model
- `domain_retriever` is a function that, from an identifier, returns a corresponding `panda`'s `DataFrame` 

The result of `execute_pipeline` is a tuple formed by:
- the transformed `DataFrame`,
- a `PipelineExecutionReport` with details about time and memory usage each of its steps.

## Playground server

See `playground.py`. It provides a simple server that showcase how to use the module and test it.
