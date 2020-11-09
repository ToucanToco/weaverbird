---
title: Evolution
permalink: /docs/evolution/
---

### Compute evolution

You can use this step if you need to compute the row-by-row evolution of a value
column, based on a date column. It will output 2 columns: one for the evolution
in absolute value, the other for the evolution in percentage.

You must be careful that the computation is scoped so that there are no dates
duplicates (so that any date finds no more than one previous date). That means
that you may need to specify "group by" columns to make any date unique inside
each group.

**This step is supported by the following backends:**

- Mongo 4.0
- Mongo 3.6
- Pandas (python)

#### Where to find this step?

- Widget `Compute`
- Search bar

#### Options reference

<img src="../../img/docs/user-interface/evolution_step_form.png" width="350" />

- `Date column`: the date column (must be of type date) that will be used as a
  reference for the computation

- `Value column`: the value column that you want to compute the evolution of

- `Compute evolution vs`: whether you want to compute evolution versus last year,
  last month, last week or last day

- `(Optional) Group by`: (optional). Use this option if you need to perform the
  evolution computation by group of rows. You should do so to make sure every
  date is unique inside each and every group. See examples 2 and 3 for a
  concrete illustration.

- `(Optional) New column name`: (optional). Use this option if you want to give
  a custom name to the output column. By default, it will be your original
  column name suffixed with either "\_EVOL_ABS" or "\_EVOL_ABS" depending on the
  kind of evolution that you chose.

#### Example 1: Basic configuration

<img src="../../img/docs/user-interface/evolution_example_conf_1.png" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/evolution_example_result_1.png" width="500" />

#### Example 2: Error on duplicate dates

<img src="../../img/docs/user-interface/evolution_example_conf_2.png" width="750" />

This configuration results a dataset with the Mongo translators, with an error
at row-level as shown below.
The pandas translator will throw an error only, and no data will be returned.

<img src="../../img/docs/user-interface/evolution_example_result_2.png" width="500" />

#### Example 3: Complete configuration with index columns

<img src="../../img/docs/user-interface/evolution_example_conf_3.png" width="750" />

This configuration will results in:

<img src="../../img/docs/user-interface/evolution_example_result_3.png" width="500" />
