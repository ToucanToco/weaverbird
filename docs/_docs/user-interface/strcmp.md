---
title: Compare Text Columns
permalink: /docs/strcmp/
---

### Compute Duration

Compares 2 string columns and returns true if the string values are equal,
and false oteherwise.
The comparison is case-sensitive (see example below).

**This step is supported by the following backends:**

- Mongo 4.2
- Mongo 4.0
- Mongo 3.6
- Pandas (python)

#### Where to find this step?

- Widget `Text`
- Search bar

#### Options reference

<img src="../../img/docs/user-interface/strcmp_step_form.jpg" width="350" />

- `New column name`: the new column to be created for the comparison result

- `First text column`: the first text column to be compared

- `Second text column`: the second column to be compared

#### Example

<img src="../../img/docs/user-interface/strcmp_example_conf.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/strcmp_example_result.jpg" width="500" />
