---
title: Filter
permalink: /docs/filter/
---

### Filter rows

You can use this step to filter rows based on one or several conditions. At the
moment, we only support `and` as logical link between conditions.

**This step is supported by the following backends:**

- Mongo 5.0
- Mongo 4.2
- Mongo 4.0
- Mongo 3.6
- Pandas (python)

#### Where to find this step?

- Column header menu
- Widget `Filter`
- Search bar

#### Options reference

<img src="../../img/docs/user-interface/filter_step_form.jpg" width="350" />

You can specify either one or several condition(s) to filter rows.
A simple condition is defined by a target column, a comparison operator
("equals", "doesn't equal"...) and an input where you can specify value(s) to be
compared to.

You can either add a simple condition line, or a group of simple conditions
that you can bind by either an "AND" or an "OR" logical operator.
Note that you cannot nest a group of conditions in another group.

> Tip: If you need to filter null values, use the dedicated operators "null" or
> "not null". If you try to write the value 'null' with an "equals" or
> "does not equal" operator, it will be considered as text, not as a null value.

#### Example

<img src="../../img/docs/user-interface/filter_example_conf.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/filter_example_result.jpg" width="500" />
