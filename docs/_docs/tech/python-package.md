---
title: Python
permalink: /docs/python-package/
---

# Weaverbird [python package](https://pypi.org/project/weaverbird/)

The python module provide a way to run transformations described in a pipeline.
Its code reside in the `server/` folder.

## Purpose

This package provides utility functions to translate weaverbird's pipelines into Python functions, powered by [pandas](https://pandas.pydata.org/).
It is meant as a building block to create servers capable of understanding and executing such pipelines, and returning them to clients.

## Installation

We use [poetry](https://python-poetry.org/) for managing dependencies.

Main commands are available through `make`:

    make install # Install dependecies

    make format # Fix formatting issues using black and isort
    make lint # Execute various checks

    make build # Build the project prior to publication
    make publish # Publish on pypi

    make test # Execute the test suite and produce reports

## Content

The package exposes:
- a [pydantic](https://pydantic-docs.helpmanual.io/) model `Pipeline` which mirror the pipeline definition used by the front-end
- a `PipelineExcutor` class to turn pipelines into transformation functions

## Usage

### Validate a pipeline

Using the pydantic model, one can validate that a series of pipeline steps are valid:
```python
from weaverbird.pipeline import Pipeline

pipeline_steps = [{'name': 'domain', 'domain': 'example'}]

pipeline = Pipeline(steps=pipeline_steps)
```

### Execute a pipeline

```python
from weaverbird.pipeline_executor import PipelineExecutor

executor = PipelineExecutor(domain_retriever)
executor.execute_pipeline(pipeline)
```

where:
- `pipeline` is an instance of the `Pipeline` model
- `domain_retriever` is a function that, from an identifier, returns a corresponding `panda`'s `DataFrame` 

The result of `execute_pipeline` is the transformed `DataFrame`.

## Playground server

See `playground.py`. It provides a simple server that showcase how to use the module and test it.
