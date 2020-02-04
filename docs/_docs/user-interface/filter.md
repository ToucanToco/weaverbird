---
title: Filter
permalink: /docs/filter/
---

### Filter rows

You can use this step to filter rows based on one or several conditions. At the
moment, we only support `and` as logical link between conditions.

**This step is supported by the following backends:**

- Mongo 4.0
- Mongo 3.6

#### Where to find this step?

- Column header menu
- Widget `Filter`
- Search bar

#### Options reference

<img src="../../img/docs/user-interface/filter_step_form.jpg" width="350" />

- `Values in ...`: the target column

- `Must...`: a comparison operator (equal, not equal etc.)

- Then you can enter value(s) to be compared to. For `be one of` and `not be one
  of` operators, you can enter several values. For the `be null` and `not be
  null` operators, you do not need to enter any value as it is a comparison
  aginst `null` values. `matches` and `notmatches` operators are used to test
  value against a regular expression.

- `Add condition`: use this button if you need to add a new condition line. The
  retained rows will be those match every condition (logical `and`)

#### Example

<img src="../../img/docs/user-interface/filter_example_conf.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/filter_example_result.jpg" width="500" />
