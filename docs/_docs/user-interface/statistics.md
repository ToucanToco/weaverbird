---
title: Column's Statistics
permalink: /docs/statistics/
---

### Column's Statistics

You can use this step to compute main statistics, like median or quintiles, of a numeric column.

**This step is supported by the following backends:**

- Mongo 4.2
- Mongo 4.0
- Mongo 3.6

#### Where to find this step?

- Column header menu
- Widget `Compute`
- Search bar

#### Options reference

<img src="../../img/docs/user-interface/statistics_form_1.jpg" width="350" />

- Choose the column to compute the statistics. This column must be of type 'float' or 'integer'.

- Optionally, you can split the result by other columns values.

- Check statistics to compute.

- You can also in the "custom quantile" section define quantiles. For instance, the median is the 1st 2-quantile.


#### Examples

#### Basic example

<img src="../../img/docs/user-interface/statistics_form_2.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/statistics_result_2.jpg" width="500" />


#### With a group column

<img src="../../img/docs/user-interface/statistics_form_1.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/statistics_result_1.jpg" width="500" />


#### Defining a custom quantile

<img src="../../img/docs/user-interface/statistics_form_3.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/statistics_result_3.jpg" width="500" />
