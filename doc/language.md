## Language definition

Each time a column is refered to, it should accept the notation `domain_name.column_name` or `column_name` when there is only one domain in input.

### 'domain' step

This step is meant to select a specific domain (using MongoDB terminology).

```javascript
{
    name: 'domain',
    domain: 'my-domain'
}
```

### 'filter' step

Filter out lines that don't match a filter definition.

```javascript
{
    name: 'filter',
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
    name: 'select',
    column: 'my-column' -> should accept expressions like "*" and "(my_colmun * my_other_column) / 100"
    as: 'new-column-name'
}
```

### 'rename' step

I don't think this step is needed with a more "complete" `select`.

### 'delete' step

Delete a column.

```javascript
{
    name: 'delete',
    column: 'my-column'
}
```

### 'custom' step

This step allows to define a custom query that can't be expressed using the
other existing steps.

```javascript
{
    name: 'custom',
    query: '$group: {_id: ...}',
}
```
