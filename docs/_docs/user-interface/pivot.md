---
title: Pivot
permalink: /docs/pivot/
---

### Pivot column

You can use this step if you need to transform rows into columns. It is the
reverse operation of an `unpivot` step.

Pivoting a column into several columns means that every unique label found in
that column becomes a column header. The column gets pivoted "around" fixed
columns that you can specify. You also need to specify a value column where
values will be found to fill pivoted columns. If aggregation needs to be
performed, you can choose the aggregation function (`sum` by default).

Equivalent to the `PIVOT` clause in SQL.

**This step is supported by the following backends:**

- Mongo 4.0
- Mongo 3.6

#### Where to find this step?

- Widget `Reshape`
- Search bar

#### Options reference

<img src="../../img/docs/user-interface/pivot_step_form.jpg" width="350" />

- `Keep columns...`: the columns to remain fixed, around which the pivot will
  occur

- `Pivot column...`: the column to be pivoted

- `Use values in...`: the columns where values are found to fill the pivoted
  columns

- `Aggregate values using...`: the aggregation function to be used when
  aggregation has to be performed

#### Example

<img src="../../img/docs/user-interface/pivot_example_conf.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/pivot_example_result.jpg" width="500" />
