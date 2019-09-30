# Using variables in pipeline

## Why

The idea is to be able to build _templatable_ queries with values that
could be parametrized.

As often, an example is better than a lot of words. Imagine the following
pipeline that filters out lines where `age <= 20`:

```json
[
  {
    "name": "domain",
    "domain": "team_infos",
  },
  {
    "name": "filter",
    "condition": {
      "and": [
        "operator": "gt",
        "column": "age",
        "value": 20
      ]
    }
  }
]
```

Now suppose that you include the visual query builder inside a host application
that lets you enter the age in an input field. You might then want to
parametrize the "age" value and reuse your pipeline with this specific value.

Using [lodash template syntax](https://lodash.com/docs/4.17.15#template), this
could look like:

```json
[
  {
    "name": "domain",
    "domain": "team_infos",
  },
  {
    "name": "filter",
    "condition": {
      "and": [
        "operator": "gt",
        "column": "age",
        "value": "<%= age %>"
      ]
    }
  }
]
```

## How

It is possible to define a _variable context_ (i.e. a _bag of variables_) in the
store that can later be used and referenced in the pipeline steps. We also need
to specify an interpolation function that will take a template string and
replace it with the corresponding value. This function needs to have the
following signature:

```typescript
type InterpolateFunction = (template: string, context: ScopeContext) => any;
```

`ScopeContext` is just a mapping of variable names to values.

### Example

Imagine that you want to use the [lodash template
syntax](https://lodash.com/docs/4.17.15#template) to reference your variables,
you would then need to provide an interpolation function that would take a
lodash templated string, the variables map and return the interpolated string:

```typescript
import _ from 'lodash';

function interpolate(value: string, context: ScopeContext) {
  const compiled = _.template(value);
  return compiled(context);
}
```

and feed your store with all this:

```javascript
{
  //...
  variables: {
    age: 42
  },
  interpolationFunc: interpolate,
  //...
}
```

## Steps concerned

For now, only a few steps handle variables interpolation but the support of this
feature will be improved progressively in the next releases.

So far, the steps concerned are:

- `fillna`: the `value` property can be interpolated,
- `filter`: the `value` property of each condition type can be interpolated,
- `formula`: the `formula` property can be interpolated,
- `replace`: each value in the `to_replace` can be interpolated,
- `top`: the `limit` property can be interpolated.

Another important limitation _for now_ is that except for the `top.limit`, the
interpolation will insert string values, i.e. an interpolated filtered value
cannot be an integer.
