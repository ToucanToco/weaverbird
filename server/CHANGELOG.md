# Changelog (weaverbird python package)

## Unreleased

## [0.22.0] - 2022-08-18

- Added Pypika's `UNPIVOT` step


## [0.21.0] - 2022-08-05

- Switched Snowflake backend in the playground to PyPika
- Added a `TO_TIMESTAMP_NTZ` operator to the ToDateOp enum
- Renamed `TIMESTAMP` operator to `TO_TIMESTAMP`
- Bumped dependencies in lockfile

## [0.20.1] - 2022-08-02

- Bumped flake8 and fixed dependency lock file

## [0.20.0] - 2022-08-01

- Pypika: force converted date to timestamps

## [0.19.2] - 2022-08-01

- Pypika: Snowflake Dateextract fix some formulas

## [0.19.1] - 2022-07-29

- The Reference type is now hashable

## [0.19.0] - 2022-07-28

- Pypika: snowflake dateextract step

## [0.18.0] - 2022-07-27

- Pypika: evolution step

## [0.17.3] - 2022-07-06

- CustomSQL step: Sanitize query

## [0.17.2] - 2022-07-01

- Playground: Add missing toucan-connectors[awsathena] dependency

## [0.17.1] - 2022-06-30

- Tests: enable integration tests for Big Query
- Playground: Added support for Big Query and Athena

## [0.17.0] - 2022-06-27

- feat: add step to compute absolute value
- Feat: Add `SUPPORT_ROW_NUMBER` and `SUPPORT_SPLIT_PART` to PyPika Athena translator
- Fix: Return N results for every group in the `top` step of the PyPika translator
- Fix: Ensure RowNumber() has an alias in the `top` step of the PyPika translator
- Fix: Ensure the `top` step of the PyPika translator returns consistent results

## [0.16.1] - 2022-06-22

- Fix: rename the sql dialect used for postgres

## [0.16.0] - 2022-06-22

- Feat: Handle code mode queries in pypika translator

## [0.15.0] - 2022-06-21

- Feat: Add SQL backend powered by PyPika
- Feat: Added a geographical hierarchy step to pandas executor
- Feat: Added a geographical dissolve step to pandas executor
- Feat: Added a geographical simplify step to pandas executor
- Feat: Support joins with geographical data in pandas executor

## [0.14.0] - 2022-06-14

- Changed: deleting a non-existing columns doesn't trigger an error (pandas, SQL)

## [0.13.0] - 2022-06-13

- Move to poetry for dependency management
- Dropped python<3.10 support

## [0.12.6] - 2022-06-06

- Fix parsing error for Step(s) objects from logs
- Updated the parsing format of a step monitoring (pandas)

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
