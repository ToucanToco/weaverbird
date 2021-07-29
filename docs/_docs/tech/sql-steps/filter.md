# `filter` step

Filters out lines that match or don't match a filter definition.
For detailed explanations on configuration in UI, refer to `user-interface/filter`.

```javascript
{
    name: 'filter',
    condition: {
      column: 'my-column',
      value: 42,
      operator: 'ne'
    }
}
```
For example this step would generate a query like this: 

```
FILTER_STEP_1 AS (SELECT * FROM SELECT_STEP_0 WHERE my-column != 42)
```


`operator` is optional, and defaults to `eq`. Allowed operators are `eq`, `ne`,
`gt`, `ge`, `lt`, `le`, `in`, `nin`, `matches`, `notmatches` `isnull` or `notnull`.

`value` can be an arbitrary value depending on the selected operator (e.g a list
when used with the `in` operator, or `null` when used with the `isnull`
operator).

`matches` and `notmatches` operators are used to test value against a regular expression.

Conditions can be grouped and nested with logical operators `and` and `or`.

```javascript
{
    name: 'filter',
    condition: {
      and: [
        {
          column: 'my-column',
          value: 42,
          operator: 'gte'
        },
        {
          column: 'my-column',
          value: 118,
          operator: 'lte'
        },
        {
          or: [
            {
              column: 'my-other-column',
              value: 'blue',
              operator: 'eq'
            },
            {
              column: 'my-other-column',
              value: 'red',
              operator: 'eq'
            }
          ]
        }
      ]
    }
}
```
