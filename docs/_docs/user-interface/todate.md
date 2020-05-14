---
title: Convert text to date
permalink: /docs/todate/
---

### Convert text column to date

You can use this step to cast a text column to date.

**This step is supported by the following backends:**

- Mongo 4.0
- Mongo 3.6

#### Where to find this step?

- Widget `Date`
- Search bar
- Column header data type icon

#### Options reference

<img src="../../img/docs/user-interface/todate_step_form.jpg" width="350" /></br>

<img src="../../img/docs/user-interface/todate_step_form_presets.jpg" width="350" /></br>

<img src="../../img/docs/user-interface/todate_step_form_custom.jpg" width="350" /></br>

- `Column to convert:`: the text column to be converted to date

- `format:`: either 'Try to guess' (the backend tries to infer the date format of your column),
  'Custom' (to allow you to enter a custom format in the `custom format` parameter below),
  or a preset (e.g. "%d-%m-%Y"). Please see the [Mongo documentation](https://docs.mongodb.com/manual/reference/operator/aggregation/dateFromString/index.html#datefromstring-format-specifiers)
  for Mongo custom supported formats.

#### Example

<img src="../../img/docs/user-interface/todate_example_conf.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/todate_example_result.jpg" width="500" />
