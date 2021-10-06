---
title: Cumulated sum
permalink: /docs/cumsum/
---

### Cumulated sum

This step allows to compute the cumulated sum of value column based on a
reference column (usually dates) to be sorted by ascending order for the needs
of the computation. The computation can be scoped by group if needed.

**This step is supported by the following backends:**

- Mongo 5.0
- Mongo 4.2
- Mongo 4.0
- Mongo 3.6

#### Where to find this step?

- Widget `Compute`
- Search bar

#### Options reference

<img src="../../img/docs/user-interface/cumsum_step_form.jpg" width="350" />

- `Value column to sum`: the value column you want to compute the cumulated sum
  of.

- `Reference column to sort (usually dates)`: the column that will be used to
  order rows in ascending order. Usually you will use a date column here
  (to compute a year-to-date result for exemple)

- `(Optional) Group cumulated sum by`: optional, if you need to apply the
  cumulated sum computation by group of rows, you may specify here the columns
  to be used to constitute groups (see example 2 below)

- `(Optional) New column name`: Optional, if you want to give a custom name to
  the output column to be created (by default it will be your original columnn
  name suffixed by '\_CUMSUM').

#### Example 1 : Basic configuration

<img src="../../img/docs/user-interface/cumsum_example_conf_1.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/cumsum_example_result_1.jpg" width="500" />

#### Example 2 : Configuration with optional parameters

<img src="../../img/docs/user-interface/cumsum_example_conf_2.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/cumsum_example_result_2.jpg" width="500" />
