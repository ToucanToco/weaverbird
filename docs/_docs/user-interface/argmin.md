---
title: Argmin
permalink: /docs/argmin/
---

### Argmin

You can use this step to get row(s) matching the minimum value in a given
column. You can optionally specify to apply the step by group, i.e. get min
row(s) by group.

#### Where to find this step?

- Widget `Filter`
- Search bar

#### Options reference

<img src="/img/docs/user-interface/argmin_step_form.jpg" width="350" />

- `Search min value in...`: the column the minimum value will be searched in

- `Group by...` (optional): you can optionally select one or several columns
  that will be used to constitute unique groups (equivalent to the columns that
  you would specify after the `GROUP BY` clause in SQL or in the `_id` field of
  a `$group` in Mongo aggregation pipeline). Then the step will return min
  row(s) for every group)

#### Example

<img src="/img/docs/user-interface/argmin_example_conf.jpg" width="750" />

This configuration results in:

<img src="/img/docs/user-interface/argmin_example_result.jpg" width="500" />