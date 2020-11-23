---
title: UI components
permalink: /docs/ui-components/
---

# UI components

For use in your own application, Weaverbird exports a bunch of Vue components:

## Vqb: the all-in-one component

The `Vqb` component contains the full UI of Weaverbird.

To run correctly, it assumes the Vqb Vuex store module is present. The helper `registerModule` take care of this part: provide it its initial state and the translator you wish to use. 

```js
import { registerModule, Vqb } from 'weaverbird';

new Vue({
  el: '#app',
  components: {
    Vqb,
  },
  created: function() {
    registerModule(this.$store, {
      currentPipelineName: 'pipeline',
      pipelines: {
        pipeline: [ ...]
      },
      translator: 'mongo40',
    });
  }
});

```

> An example of such integration is provided in `playground/dist/app.js`.

## Main sub-components

The `Vqb` component consists is three sub-components, that you can use as well to fit it nicely into your app.

- `QueryBuilder` is the main left panel, where user see the current pipeline and can edit its steps.
- `DataViewer` is the main right panel, where the data table resides and the associated actions.
- `PipelineSelector` is the simple dropdown to select the currently displayed pipeline.

## Utility components

Weaverbird also exports some of its internal components so they can be reused elsewhere.

- `FilterEditor` is the main component of the Filter step. It can display and edit trees of filtering conditions.

> These components are not directly part of the public API. Changes can happen between versions.
