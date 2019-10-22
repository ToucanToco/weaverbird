---
title: Fill null
permalink: /docs/filter/
---

### Filter rows

You can use this step to filter rows based on one or several conditions. At the
moment, we only support `and` as logical link between conditions.

#### Where to find this step?

- Column header menu
- Widget `Filter`
- Search bar

#### Options reference

<img src="../../img/docs/user-interface/filter_step_form.jpg" width="350" />

- `Values in ...`: the target column

- `Must...`: a comparison operator (equal, not equal etc.)

- Then you can enter a value to be compared to. For `be one of` and `not be one of`
  comparison operators, you can enter several values

- `Add condition`: use this button if you need to add a new condition line. The
  retained rows will be those match every condition (logical `and`)

#### Example

<img src="../../img/docs/user-interface/filter_example_conf.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/filter_example_result.jpg" width="500" />
