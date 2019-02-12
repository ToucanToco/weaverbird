## Language definition

### 'domain' step

This step is meant to select a specific domain (using MongoDB terminology).

```javascript
{
    step: 'domain',
    domain: 'my-domain'
}
```

### 'filter' step

Filter out lines that don't match a filter definition.

```javascript
{
    step: 'filter',
    column: 'my-column',
    value: 42
    operator: 'ne'
}
```

`operator` is optional, and defaults to `eq`. Allowed operators are `eq`, `ne`,
`gt`, `ge`, `lt`, `le`, `in`, `nin`.

`value` can be an arbitrary value (e.g a list when used with the `in` operator)

### 'select' step

Select a column. The default is to keep every columns of the input domain. If
the `select` is used, it will only keep selected columns in the output.

```javascript
{
    step: 'select',
    column: 'my-column'
}
```

### 'rename' step

Rename a column.,

```javascript
{
    step: 'filter',
    oldname: 'old-column-name',
    newname: 'new-column-name'
}
```

### 'delete' step

Delete a column.

```javascript
{
    step: 'delete',
    column: 'my-column'
}
```

### 'custom' step

This step allows to define a custom query that can't be expressed using the
other existing steps.

```javascript
{
    step: 'custom',
    query: '$group: {_id: ...}',
}
```
