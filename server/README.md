# weaverbird python package

See [docs about purpose and usage](../docs/_docs/tech/python-package.md).

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
