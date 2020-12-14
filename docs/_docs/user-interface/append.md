---
title: Append
permalink: /docs/append/
---

### Append

You can use this step to append on or several registered datasets to the
current dataset

**This step is supported by the following backends:**

- Mongo 4.2
- Mongo 4.0
- Mongo 3.6
- Pandas (python)

#### Where to find this step?

- Widget `Combine`
- Search bar

#### Options reference

<img src="../../img/docs/user-interface/append_step_form.jpg" width="350" />

- `Select datasets to append`: the name of the datasets you want to append to
  the current dataset

#### Example

Say your daatset being currently edited looks like this:

<img src="../../img/docs/user-interface/append_example_current_dataset.jpg" width="500" />

And say you have 2 datasets, `dataset1` and `dataset2` stored in your application:

- `dataset1`:

  <img src="../../img/docs/user-interface/append_example_dataset1.jpg" width="500" />

- `dataset2`:

  <img src="../../img/docs/user-interface/append_example_dataset2.jpg" width="500" />

Then if you you apply the following configuration on the current dataset...

<img src="../../img/docs/user-interface/append_example_conf.jpg" width="750" />

...It will result in:

<img src="../../img/docs/user-interface/append_example_result.jpg" width="500" />
