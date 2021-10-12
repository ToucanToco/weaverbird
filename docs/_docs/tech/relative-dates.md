---
title: Relative dates
permalink: /docs/relative-dates/
---

# Relative dates

## Need

When creating pipelines that filter time-series (datasets with a date column), it's a common need
to express a range of moments that are relative to the moment when the query is executed.

In plain english, an example would be: "data for _the last seven days_".
If we execute this query on June 4th, it would mean getting data between March 28th and June 4th.
But if we execute it on October 12th, it would be between October 5th and 12th.

## Configuration objects: `RelativeDate`

Where a date can be used to express a condition (in the `filter` step or in the `ifthenelse` step),
an object `RelativeDate` can be used instead.

This object will be translated or interpreted so that the date is relative to the moment of execution of the query.

A `RelativeDate` contains:
- `date`: the reference date from which to compute the finale date.
  `undefined` means the moment of query execution ("now").
  It can be a date variable, which would be resolved at execution time.
- `duration`: the unit used to compute the final date.
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
    "year": "{{ FIRST_DAY_OF_YEAR }}",
    "duration": "year",
    "quantity": 1
  }
  ```
  (requires the variable `FIRST_DAY_OF_YEAR` is available)
- the last two full weeks
  ```json
  {
    "date": "{{ THIS_WEEK_MONDAY }}",
    "duration": "week",
    "quantity": -2
  }
  ```
  (requires the variable `THIS_WEEK_MONDAY` is available)
