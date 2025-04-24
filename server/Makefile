.DEFAULT_GOAL := all
ruff = ruff check src tests playground.py
format = ruff format src tests playground.py

.PHONY: clean
clean:
	rm -rf `find . -name __pycache__`
	rm -f `find . -type f -name '*.py[co]' `
	rm -rf .coverage build dist *.egg-info src/*.egg-info .pytest_cache .mypy_cache

.PHONY: install
install:
	uv sync --all-extras

.PHONY: install-dev
install-dev:
	uv sync --all-extras
	pre-commit install

.PHONY: format
format:
	uv run $(format)
	uv run $(ruff) --fix

.PHONY: lint
lint:
	uv run $(ruff)
	uv run $(format) --check
	uv run mypy

.PHONY: test
test:
	uv run pytest -n 8 -m "not serial" --junitxml=test-report.xml --cov=weaverbird --cov-report xml -s

.PHONY: serial
test-serial:
	uv run pytest -m serial

.PHONY: all
all: test lint

.PHONY: build
build:
	uv build

.PHONY: upload
upload:
	uv publish

.PHONY: start_docker_playground
start-docker-playground:
	docker compose down
	docker compose up -d weaverbird mongodb

.PHONY: stop_docker_playground
stop-docker-playground:
	docker compose down
