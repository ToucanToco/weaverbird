---
title: Duration
permalink: /docs/duration/
---

### Compute Duration

Compute the duration (in days, hours, minutes or seconds) between 2 dates in a
new column.

**This step is supported by the following backends:**

- Mongo 4.0
- Mongo 3.6

#### Where to find this step?

- Widget `Dates`
- Search bar

#### Options reference

<img src="../../img/docs/user-interface/duration_step_form.png" width="350" />

- `New column name`: the new column to be created for the computation result

- `Start date column`: the starting date

- `End date column`: the ending date

- `Duration in`: the duration units (days, hours, minutes or seconds)

#### Example 1: duration in days

<img src="../../img/docs/user-interface/duration_example_conf_1.png" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/duration_example_result_1.png" width="500" />

#### Example 2: duration in minutes

<img src="../../img/docs/user-interface/duration_example_conf_2.png" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/duration_example_result_2.png" width="500" />
