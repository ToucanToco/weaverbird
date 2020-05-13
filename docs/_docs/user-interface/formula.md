---
title: Formula
permalink: /docs/formula/
---

### Formula

You can use this step to create a column as a formula based on other columns.
A column can be referenced by its name without quotes unless they include
whitespaces, in such a case you need to use brackets '[]' (e.g. \[myColumn]).

Any characters string escaped with quotes (simple or double) will be considered
as a string.

**This step is supported by the following backends:**

- Mongo 4.0
- Mongo 3.6

#### Where to find this step?

- Widget `Add` and `Compute`
- Search bar

#### Options reference

<img src="../../img/docs/user-interface/formula_step_form.jpg" width="350" />

- `New column`: the name of the new column to be created with the formula
  result.

- `Formula`: the formula, which can be an algebraic formula composed of numbers,
  maths operators and columns; it can also be a text (escaped by quotes) to
  uniformly fill the column with that text.

#### Example 1: Basic usage

<img src="../../img/docs/user-interface/formula_example_conf_1.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/formula_example_result_1.jpg" width="500" />

#### Example 2: Columnn names with whitespaces

<img src="../../img/docs/user-interface/formula_example_conf_2.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/formula_example_result_2.jpg" width="500" />
