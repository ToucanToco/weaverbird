.DEFAULT_GOAL := all
ruff = ruff src tests playground.py
black = black src tests playground.py

.PHONY: clean
clean:
	rm -rf `find . -name __pycache__`
	rm -f `find . -type f -name '*.py[co]' `
	rm -rf .coverage build dist *.egg-info src/*.egg-info .pytest_cache .mypy_cache

.PHONY: install
install:
	poetry install --only main -E all

.PHONY: install-dev
install-dev:
	poetry install -E all
	pre-commit install

.PHONY: install-playground
install-playground:
	poetry install -E playground

.PHONY: format
format:
	poetry run $(ruff) --fix
	poetry run $(black)

.PHONY: lint
lint:
	$(ruff)
	$(black) --check
	mypy

.PHONY: test
test:
	python -m pytest -n 8 -m "not serial" --junitxml=test-report.xml --cov=weaverbird --cov-report xml -s

.PHONY: serial
test-serial:
	python -m pytest -m serial

.PHONY: all
all: test lint

.PHONY: build
build:
	poetry build

.PHONY: upload
upload:
	poetry publish --build

.PHONY: start_docker_playground
start_docker_playground:
	docker-compose down
	docker-compose up -d weaverbird mongodb

.PHONY: stop_docker_playground
stop_docker_playground:
	docker-compose down
