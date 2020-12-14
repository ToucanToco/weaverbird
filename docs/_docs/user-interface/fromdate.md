---
title: Convert date to text
permalink: /docs/fromdate/
---

### Convert date column to text

You can use this step to cast a date column to a text column.

**This step is supported by the following backends:**

- Mongo 4.2
- Mongo 4.0
- Mongo 3.6

#### Where to find this step?

- Widget `Date`
- Search bar

#### Options reference

<img src="../../img/docs/user-interface/fromdate_step_form.jpg" width="350" />

<img src="../../img/docs/user-interface/fromdate_step_form_presets.jpg" width="350" /></br>

<img src="../../img/docs/user-interface/fromdate_step_form_custom.jpg" width="350" /></br>

- `Column to convert:`: the date column to be converted to text

- `Date format:`: either 'Custom' (to allow you to enter a custom format in the
  `custom format` parameter below), or a preset (e.g. "%d-%m-%Y")

- `Custom format:`: only displayed and required if you selected 'custom' in the
  `Date format` parameter. Please see the [Mongo documentation](https://docs.mongodb.com/manual/reference/operator/aggregation/dateFromString/index.html#datefromstring-format-specifiers)
  for Mongo supported formats.

#### Example

<img src="../../img/docs/user-interface/fromdate_example_conf.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/fromdate_example_result.jpg" width="500" />
