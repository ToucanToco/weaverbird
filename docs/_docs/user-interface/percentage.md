---
title: Percentage
permalink: /docs/percentage/
---

### Percentage

Compute the percentage of total as the share of every row in the column total.
The computation can be performed by group if specified (i.e. the percentage of
total will be computed inside every group, as the share of every row in the
total of its group).

#### Where to find this step?

- Widget `Compute`
- Search bar

#### Options reference

<img src="../../img/docs/user-interface/percentage_step_form.jpg" width="350" />

- `Value column...`: The column that will be used for the computation

- `Group by...` (optional): if you want the computation to be segmented by
  group, you can select one or several columns that will be used to constitute
  unique groups (equivalent to the columns that you would specify after the
  `GROUP BY` clause in SQL or in the `_id` field of a `$group` in Mongo
  aggregation pipeline)

#### Example

<img src="../../img/docs/user-interface/percentage_example_conf.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/percentage_example_result.jpg" width="500" />
