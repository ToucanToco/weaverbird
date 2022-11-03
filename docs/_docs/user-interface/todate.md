---
title: Convert text to date
permalink: /docs/todate/
---

### Convert text column to date

You can use this step to cast a text column to date.

**This step is supported by the following backends:**

- AWS Athena
- Google Big Query
- MySQL
- PostgreSQL
- AWS Redshift
- Snowflake
- Pandas
- Mongo 5.0
- Mongo 4.2
- Mongo 4.0
- Mongo 3.6

#### Where to find this step?

- Widget `Date`
- Search bar
- Column header data type icon

#### Options reference

<img src="../../img/docs/user-interface/todate_step_form.jpg" width="350" /></br>

<img src="../../img/docs/user-interface/todate_step_form_presets.jpg" width="350" /></br>

<img src="../../img/docs/user-interface/todate_step_form_custom.jpg" width="350" /></br>

- `Column to convert:`: the text column to be converted to date

- `format:`: either 'Try to guess' (the backend tries to infer the date format of your column),
  'Custom' (to allow you to enter a custom format in the `custom format` parameter below),
  or a preset (e.g. "%d-%m-%Y").

  Depending on your backend, see the adequate documentation for supported custom formats:

    * [Mongo](https://docs.mongodb.com/manual/reference/operator/aggregation/dateFromString/index.html#datefromstring-format-specifiers)
    * [Pandas](https://docs.python.org/3/library/datetime.html#strftime-and-strptime-behavior)
    * [AWS Athena](https://prestodb.io/docs/current/functions/datetime.html#mysql-date-functions)
    * [Google Big Query](https://cloud.google.com/bigquery/docs/reference/standard-sql/format-elements#format_elements_date_time)
    * [MySQL](https://dev.mysql.com/doc/refman/8.0/en/date-and-time-functions.html#function_date-format)
    * [PostgreSQL](https://www.postgresql.org/docs/8.2/functions-formatting.html#FUNCTIONS-FORMATTING-DATETIME-TABLE)
    * [AWS Redshift](https://docs.aws.amazon.com/redshift/latest/dg/r_FORMAT_strings.html)
    * [Snowflake](https://docs.snowflake.com/en/sql-reference/functions-conversion.html#date-and-time-formats-in-conversion-functions)

#### Example

<img src="../../img/docs/user-interface/todate_example_conf.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/todate_example_result.jpg" width="500" />
