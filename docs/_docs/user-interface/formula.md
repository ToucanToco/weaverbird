---
title: Formula
permalink: /docs/formula/
---

### Formula

You can use this step to create a column as a formula based on other columns.
A column can be referenced by its name without quotes or any other escaping
character.

**Warning: we do not support column names including whitespaces at the moment.
So please apply a rename step beforehand if needed.** (For example rename
`my column` into `my_column`)

You can also specify a text escaped by quotes. It will then write the specified
text in every row of the new column.

#### Where to find this step?

- Widget `Compute`
- Search bar

#### Options reference

<img src="../../img/docs/user-interface/formula_step_form.jpg" width="350" />

- `Formula`: the formula, which can be an algebraic formula composed of numbers,
  maths operators and columns; it can also be a text (escaped by quotes) to
  uniformly fill the column with that text.

- `New column`: the name of the new column to be created with the formula
  result.

#### Example 1: algebric formula

<img src="../../img/docs/user-interface/formula_example_conf_1.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/formula_example_result_1.jpg" width="500" />

#### Example 2: filling a column with a text

<img src="../../img/docs/user-interface/formula_example_conf_2.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/formula_example_result_2.jpg" width="500" />
