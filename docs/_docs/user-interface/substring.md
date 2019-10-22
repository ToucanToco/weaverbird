---
title: Extract substring
permalink: /docs/substring/
---

### Extract substring

You can use this step to exctract a sustring of characters in a text column.

> Hint: you can use this step on a numeric column to convert that numeric
> column to a text column (i.e. it converts numbers into a numeric text).

#### Where to find this step?

- Widget `Text`
- Search bar

#### Options reference

<img src="../../img/docs/user-interface/substring_step_form.jpg" width="350" />

- `Extract a substring from...`: the text column you need to extract a substring
  from
- `Substring starts at character position`: the position of the first character
  of the sustring you want to extract.
- `Substring ends at character position`: the position of the last character
  of the sustring you want to extract.

The character positions are integers that can be either positive (starting at 1
for the first character of the original string) or negative (starting at -1 for
the last character of the original string). The can never be equal to 0.

The character position of the last character of the substring should always
refer to a character position higher than the first character of the substring.
If not, you will get a backend error.

> Hint: use negative character positions when you need to count characters from
> the end of the original string.

#### Example 1: positive character positions

<img src="../../img/docs/user-interface/substring_example_conf_1.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/substring_example_result.jpg" width="500" />

#### Example 2: negative character positions

<img src="../../img/docs/user-interface/substring_example_conf_2.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/substring_example_result.jpg" width="500" />
