---
title: ifthenelse
permalink: /docs/ifthenelse/
---

### If...Then...Else

You can use this step to create a new column, which values will depend on a
condition expressed on existing columns.

**This step is supported by the following backends:**

- Mongo 5.0
- Mongo 4.2
- Mongo 4.0 (`matches` and `not matches` operators are not supported in conditions)
- Mongo 3.6 (`matches` and `not matches` operators are not supported in conditions)

#### Where to find this step?

- Widget `Add`
- Search bar

#### Options reference

<img src="../../img/docs/user-interface/ifthenelse_step_form.jpg" width="350" />

- `if`: This is where you can specify a condition or a group of conditions.
  Please see the [filter step documentation](https://weaverbird.toucantoco.dev/docs/filter/)
  or more dtails on how conditions work.

- `then`: here you can specify the value of the column if the `if` condition is
  evaluated to `true`. This parameter only supports a string, that will be
  interpreted as a formula (please see [formula step documentation](https://weaverbird.toucantoco.dev/docs/formula/)
  for more details on how a formula works). If you want it to be interpreted strictly as a string and not a formula, you must
  escape the string with quotes (e.g. "this is a text").

- `else`/`elseif`: here you can specify the value of the column if the `if`
  condition is evaluated to `false`.
  If `else` is selected, you need to specify a string that interpreted as a
  formula (please see [formula step documentation](https://weaverbird.toucantoco.dev/docs/formula/)
  for more details on how a formula works).
  If `elseif` is specified, you can nest another `if...then...else` block here.

#### Example

<img src="../../img/docs/user-interface/ifthenelse_example_conf.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/ifthenelse_example_result.jpg" width="500" />
