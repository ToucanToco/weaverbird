---
title: Cutom step
permalink: /docs/custom/
---

### Custom step

You can use this step to write your own query.

**This step is supported by the following backends:**

- Mongo 4.0
- Mongo 3.6

#### Where to find this step?

- Widget `Add`
- Search bar

#### Options reference

<img src="../../img/docs/user-interface/custom_step_form.jpg" width="350" />

For Mongo, you are expected to write an Aggregation Pipeline query. Please see
the [dedicated documentation](https://docs.mongodb.com/manual/reference/operator/aggregation-pipeline/)
for more information.

#### Example

<img src="../../img/docs/user-interface/custom_example_conf.jpg" width="750" />

This configuration results in:

<img src="../../img/docs/user-interface/custom_example_result.jpg" width="500" />
