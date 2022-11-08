---
title: Geographical simplification
permalink: /docs/simplify/
---

### Geographical simplification

Use this step in case you want to simplify heavy geographical data.

When simplifying your data, every point that is closer than a specific distance to the previous one is suppressed.
This step can be useful if you have a very precise shape for a country (such as one-meter precision), but want to quickly
draw a map chart. In that case, you may want to *simplify* your data.

**This step is supported by the following backends:**

- Pandas (python)

#### Where to find this step?

- `Geo` widget
- Search bar

#### Options reference

<img src="../../img/docs/user-interface/simplify_step_form.jpg" width="350" />

- `Tolerance`: The tolerance to use when simplifying your data. After simplification, no points will be closer than
  `Tolerance`. The unit depends on the unit of your data's projection, but in general, it's expressed in meters.
