---
title: Aggregate
permalink: /docs/aggregate/
---

### Aggregate

You can use this step to perform aggregations on one or several columns.
Equivalent to a `GROUP BY` clause in SQL, or to the `$group` operator in Mongo
aggregation pipeline.

#### Where to find this step?

- Widget `Aggregate`
- Search bar

#### Options reference

<img src="../../img/docs/user-interface/aggregate_step_form.jpg" width="350" />

- `Group rows by...`: you can select one or several columns that will be used
  to constitute unique groups (equivalent to the columns that you would specify
  after the `GROUP BY` clause in SQL or in the `_id` field of a `$group` in
  Mongo aggregation pipeline)

- `And aggregate...`: in this section of the form you can specify one or more
  columns to aggregate, with the corresponding aggregation function to be
  applied (equivalent to `SUM(MY_COLUMN)` for example in SQL, or to
  `my_column: { $sum: { $my_column } }` in Mongo). You can add a columnn to
  aggregate by clicking on the button `Add aggregation`.

  - `Column`: the columnn to be aggregated

  - `Function` the aggregation function to be applied (sum, average, count, min
    or max )

#### Example

<img src="../../img/docs/user-interface/aggregate_example_conf.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/aggregate_example_result.jpg" width="500" />
