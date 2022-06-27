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
	poetry install --no-dev

.PHONY: install-dev
install-dev:
	poetry install

.PHONY: install-playground
install-playground:
	poetry install -E playground

.PHONY: format
format:
	poetry run $(isort)
	poetry run $(black)

.PHONY: lint
lint:
	poetry run $(flake8)
	poetry run $(isort) --check-only
	poetry run $(black) --check
	poetry run mypy

.PHONY: test
test:
	poetry run pytest --junitxml=test-report.xml --cov=weaverbird --cov-report xml -s

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
