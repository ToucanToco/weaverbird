.DEFAULT_GOAL := all
flake8 = flake8 src tests playground.py
isort = isort src tests playground.py
black = black src tests playground.py

.PHONY: clean
clean:
	rm -rf `find . -name __pycache__`
	rm -f `find . -type f -name '*.py[co]' `
	rm -rf .coverage build dist *.egg-info src/*.egg-info .pytest_cache .mypy_cache

.PHONY: install
install:
	pip install -U pip
	pip install .

.PHONY: install-dev
install-dev:
	pip install -e ".[dev]"

.PHONY: install-playground
install-playground:
	pip install ".[playground]"

.PHONY: format
format:
	$(isort)
	$(black)

.PHONY: lint
lint:
	$(flake8)
	$(isort) --check-only
	$(black) --check
	mypy

.PHONY: test
test:
	python -m pytest --junitxml=test-report.xml --cov=weaverbird --cov-report xml -s

.PHONY: all
all: test lint

.PHONY: build
build:
	pip install build
	python -m build

.PHONY: upload
upload:
	pip install twine
	twine upload dist/*

# Easy mode to use locally with pyCharm
.PHONY: install_local
install_local:
	rm -rf dist/*
	make build
	FILENAME="$(shell ls -1t dist/*.gz | head -1)"; echo $$FILENAME
	FILENAME="$(shell ls -1t dist/*.gz | head -1)"; pip install $$FILENAME

.PHONY: execute_local_test
execute_local_test: install_local test
