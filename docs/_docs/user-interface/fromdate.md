---
title: Convert date to text
permalink: /docs/fromdate/
---

### Convert date column to text

You can use this step to cast a date column to a text column.

**This step is supported by the following backends:**

- Mongo 4.0
- Mongo 3.6

#### Where to find this step?

- Widget `Date`
- Search bar

#### Options reference

<img src="../../img/docs/user-interface/fromdate_step_form.jpg" width="350" />

- `Column to convert:`: the date column to be converted to text

- `Date format:`: here you can specify how the text will be formatted.

Please see the [Mongo documentation](https://docs.mongodb.com/manual/reference/operator/aggregation/dateFromString/index.html#datefromstring-format-specifiers)
for Mongo supported formats.

#### Example

<img src="../../img/docs/user-interface/fromdate_example_conf.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/fromdate_example_result.jpg" width="500" />
