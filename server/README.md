# weaverbird python package

This package provides utility functions to translate weaverbird's pipelines into Python functions, powered by [pandas](https://pandas.pydata.org/).
It is meant as a building block to create servers capable of understanding and executing such pipelines, and returning them to clients.
You can see it as a [translator](../docs/_docs/tech/translators.md) for Python.

## Development

We use [poetry](https://python-poetry.org/) for managing dependencies.

Main commands are available through `make`:

    make install # Install dependecies

    make format # Fix formatting issues using black and isort
    make lint # Execute various checks

    make build # Build the project prior to publication
    make upload # Publish on pypi

    make test # Execute the test suite and produce reports

### Playground server

See `playground.py`. It provides a very simple server to test the module.
