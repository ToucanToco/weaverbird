# Changelog (weaverbird python package)

## Unreleased

### Fixed

- Pandas: The `evolution` step now works with columns containing `datetime.date` instances.
- Pandas: The `dateextract` step now works with columns containing `datetime.date` instances.

## [0.27.3] - 2022-12-07

### Fixed

- Pandas: Ensure the `addmissingdates` step always inserts Timestamp objects rather than integers

- MongoTranslator : We make sure the `$switch` aggregation should always have a `default` key
  field set from the mongo query to prevent "PlanExecutor error".

## [0.27.2] - 2022-11-24

- PyPika: Cast columns before applying a regex operation to them when using the `matches` or `notmatches` operator.

## [0.27.1] - 2022-11-07

- Pypika: Snowflake translator custom queryBuilder adds double quotes to `WITH` statements in order to prevent
  "unknown identifier" errors due to case insensitivity.

## [0.27.0] - 2022-11-04

- PyPika: Google Big Query translator now escapes single quotes in string literals with
a backslash (`\'`) rather than two double quotes (`''`).

## [0.26.1] - 2022-10-27

- in order to prevent SQL injection, it is no longer possible to create a CustomSQL step with variables.

## [0.26.0] - 2022-10-20

- Pypika: Snowflake translator now has a custom queryBuilder class to force the `QUOTE_CHAR` to `"`
- Feat: Added `replacetext` step for all backends
- Feat: `text` step now allows to create other types of column (when used in conjunction with variables)

### Breaking
* Dropped support for the old snowflake SQL translator

## [0.25.5] - 2022-10-11

- PyPika: Athena translator now uses `DATE_PARSE` rather than `TIMESTAMP` for the `todate` step
- PyPika: Postgres and Redshift translator now use `TO_TIMESTAMP` rather than `TIMESTAMP` for the `todate` step
- PyPika: The `text` step now does an explicit cast of the input text to the adequate text type
- PyPika: Google Big Query translator now use `PARSE_DATETIME` rather than `TIMESTAMP` for the `todate` step
- Pandas: Fixed the "filter" condition evaluation when operating with naive datetime objects

## [0.25.4] - 2022-10-06

- PyPika: Fixed "unpivot" step for mixed column types by adding intermediate convert step
- PyPika: the float type for MySQL is now DOUBLE
- PyPika: the float type for Google Big Query is now FLOAT64
- PyPika: the float type for Athena is now DOUBLE

## [0.25.3] - 2022-10-04

- PyPika: Fixed "split" step with Google Big Query backend: If provided, the delimiter is now passed wrapped in single quotes.
  Also, empty strings are returned rather than null values, for consistency with other backends
- PyPika: Fixed "split" step with Athena backend: empty strings are returned rather than null values, for consistency with other backends
- PyPika: Fixed "split" step with MySQL backend, in case there are more `keep_columns` than splitted parts, fill those with empty string
  rather than the entire string to split

## [0.25.2] - 2022-09-27

- Fixed "matches" operator behaviour of the IfThenElse step in case the column the condition applies to contains NA values

## [0.25.1] - 2022-09-27

- Bumped geopandas from 0.10.0 -> 0.11.1

## [0.25.0] - 2022-09-27

- PyPika translator: Added support for cumsum step
- PyPika translator: Added support for dateextract step to all translators except MySQL

## [0.24.2] - 2022-09-20

- PyPika translator: SQLDialect now uses the same values than frontend translator names

## [0.24.1] - 2022-09-14

- Formula AST: Change column name parser implementation to be more permissive with column names
  (everything between two square brackets is now considered part of the column name, including
  whitespace)
- Formula AST: Allow string literals to contain quote chars

## [0.24.0] - 2022-09-01

- PyPika translator: Added a `source_rows_subset` options allowing to work only on a subset of domains
- Added missing typing and adapted all typing to python 3.10 syntax

## [0.23.0] - 2022-08-30

- PyPika translator: Changed the way translator IDs are generated in order to have predictible queries. This allows to use
  translated queries as cache keys.
- Refactored the `formula` step in all backends. Formulas are now converted to an AST and evaluated by the
  different backends for increased consistency.

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
