# Changelog (weaverbird python package)

## [0.12.5] - 2022-06-03

- Updated the parsing format of a step monitoring (pandas)

## [0.12.4] - 2022-06-03

- Fix parsing error for Step(s) objects from logs

## [0.12.3] - 2022-06-02

- Added logs for each step under pandas executor

## [0.12.2] - 2022-05-27

- Fix ifthenelse step with date conditions

## [0.12.1] - 2022-05-24

- Fix: handle cumsum legacy syntax aliases

## [0.12.0] - 2022-05-22

- Use discriminated union for faster validation on steps and cleaner error messages

## [0.11.2] - 2022-03-09

- Mongo: Fix Join & Append steps to handle domain steps as str

## [0.11.1] - 2022-03-08

- Mongo: Join step & Append step in python translator


## [0.11.0] - 2022-02-25

- Domain step: support references as an alternative to names
- Cumulated Sum step: handle multiple columns
- Bootstrapped new translators:
  - PostgresSQL: convert, append, fillna, duration & ifthenelse steps
  - Mongo: argmin, argmax, filter & text steps

## [0.10.2] - 2021-12-22

- Postgres translator:
  - add an sql_dialect arg to translator & steps


## [0.10.1] - 2021-12-10

### Fixed

- SQL translator: date-extract step:
  - first day of ISO week (monday)
  - first day of week (sunday)
  - first day of previous ISO week (monday)
  - first day of previous week (sunday)
  - first day of previous month
  - first day of previous quarter
  - first day of previous year
  - day of week (sunday to sunday)
  - previous ISO week number (monday to monday)
  - previous day
  - milliseconds

## [0.10.0] - 2021-12-08

### Changed
- SQL translator: `sql_query_executor` must return directly a `DataFrame`, not a NamedTuple with the attr `df` anymore
