---
title: Dates
permalink: /docs/dates/
---

# Dates

:info: Provisional! Not yet developed

## Need

When creating pipelines that filter time-series (datasets with a date column), it's a common need
to filter on a time window. Sometimes, this window will be relative to the moment when the query is executed.

In plain english, an example would be: "data for _the last seven days_".
If we execute this query on June 4th, it would mean getting data between March 28th and June 4th.
But if we execute it on October 12th, it would be between October 5th and 12th.

## Configuration objects
Where a date can be used to express a condition (in the `filter` step or in the `ifthenelse` step),
several types of objects can represent it:

### Fixed `Date`

A standard `Date` object, representing an exact moment in time.

If you store weaverbird's pipelines to JSON, beware to serialize and deserialize them.

### `RelativeDate`

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

#### `string`: expressions resolving to dates

If some available variables have `Date` values, they can be used everywhere `Date` would be used.

## Support in steps

Dates are supported in the `value` field of `FilterSimpleCondition`.
These are used in the `filter` step and in the `ifthenelse` step.

### UI

`CustomDate` is the type regrouping the two types of configurable dates:
- fixed `Date`s,
- `RelativeDate`s.
These fields can also be `string`s that are templates resolving to a date.

`CustomDate`s are configured in steps forms using the `NewDateInput` component.

The `NewDateInput` component emits dates without time information (always midnight).

### Operators

The following operators are supported for dates:

#### From

Provide a "greater than or equal to" comparison.

Example:

```json
{
  "column": "date",
  "operator": "from",
  "value": Date("2021-10-13T00:00") // of type CustomDate | string
}
```
will select all dates after 2021-10-13T00:00.

#### Until

Provide a "less than or equal to" comparison, including the selected day.

Example:

```json
{
  "column": "date",
  "operator": "until",
  "value": Date("2021-10-13T00:00") // of type CustomDate | string
}
```
will select all dates before 2021-10-13T23:59.

As the time of dates is always midnight, we expect backends to modify time to 23:59 before doing the filtering.

#### Is

Filter all dates in the selected day.

Example:

```json
{
  "column": "date",
  "operator": "day", // using "is" would be confusing as we're not selecting an exact moment in time
  "value": Date("2021-10-13T00:00") // of type CustomDate | string
}
```
will select all dates between 2021-10-13T00:00 and 2021-10-13T23:59.

#### Isnull is notnull

Similar to `isnull` and `isnotnull` for other value types than dates.

## Support in backends

Support is planned for the following backends:
- mongo 5.0+
- SQL
- pandas

### Mongo

Support for these computations on dates rely on the `$dateAdd` aggregation operator, which is only available since v5.0.
