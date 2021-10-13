---
title: Relative dates
permalink: /docs/relative-dates/
---

# Relative dates

:info: Provisional! Not yet developed

## Need

When creating pipelines that filter time-series (datasets with a date column), it's a common need
to express a range of moments that are relative to the moment when the query is executed.

In plain english, an example would be: "data for _the last seven days_".
If we execute this query on June 4th, it would mean getting data between March 28th and June 4th.
But if we execute it on October 12th, it would be between October 5th and 12th.

## Configuration objects: `RelativeDate`

Where a date can be used to express a condition (in the `filter` step or in the `ifthenelse` step),
an object `RelativeDate` can be used instead.

This object will be translated or interpreted so that the date used in the condition is relative to the moment of execution of the query.

A `RelativeDate` contains:
- `date`: the reference date from which to compute the finale date. Either a `Date`, `undefined`, or a `string` with an expression resolving to a date.
  `undefined` means the moment of query execution ("now").
- `duration`: the unit used to compute the final date ("year", "quarter", "month", "week" or "day").
- `quantity`: either positive (in the future) or negative (in the past).

Examples:
- the last 7 days:
  ```json
  {
    "duration": "day",
    "quantity": -7
  }
  ```
- this full year:
  ```json
  {
    "date": "{{ FIRST_DAY_OF_YEAR }}",
    "duration": "year",
    "quantity": 1
  }
  ```
- the last two full weeks
  ```json
  {
    "date": "{{ THIS_WEEK_MONDAY }}",
    "duration": "week",
    "quantity": -2
  }
  ```
(These examples require the availability of some variables in the scope : `THIS_WEEK_MONDAY` and `FIRST_DAY_OF_YEAR`)

## Support in steps

Dates are supported in the `value` field of `FilterSimpleCondition`.
These are used in the `filter` step and in the `ifthenelse` step.

### Operators

Only the following operators are supported for dates:
- from: equivalent of "greater than or equal to" (`ge`),
- until (excluding): equivalent of "less than" (`lt`),
- until (including): equivalent of "less than or equal to" (`le`).

Dates can be configured only by day, so they contain no time information.
Their corresponding time should be midnight (0:00).
Exception to the dates used with operator "until (including)": their time should be 23:59 and 999ms, so any data point during the last full day should be included.

## Support in backends

Support is planned for the following backends:
- mongo 5.0+
- SQL
- pandas

### Mongo

Support for these computations on dates rely on the `$dateAdd` aggregation operator, which is only available since v5.0.
