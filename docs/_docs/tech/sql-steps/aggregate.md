# `aggregate` step 
Perform aggregations on one or several columns. Available aggregation functions
are sum, average, count, count distinct, min, max, first, last.
For detailed explanations on configuration in UI, refer to `user-interface/aggregate`.

An aggregation step has the following structure:

```javascript
{
   name: 'aggregate',
   on: ['column1'],
   aggregations:  [
    {
      newcolumns: ['sum_value1'],
      aggfunction: 'sum',
      columns: ['value1']
    }
    {
      newcolumns: ['avg_value1'],
      aggfunction: 'avg',
      columns: ['value1']
    }
  ]
}
```

`AVG, SUM, MAX, MIN, COUNT, COUNT DISTINCT` Generates fairly simple queries (with or without `group by` columns) such as:

```
WITH SELECT_STEP_0 AS (SELECT * FROM "TPCH_SF1"."CUSTOMER" limit 1000),
AGGREGATE_STEP_1 AS (SELECT SUM(value1) AS sum_value1, column1 FROM SELECT_STEP_0 GROUP BY column1)
SELECT * FROM AGGREGATE_STEP_1;
```

The case of `FIRST` and `LAST` are much more tricky. For both we rely on `ROW_COUNT()` function which is a **window function**. 
The translator as many cases to handle when performing this aggregation: 
- `FIRST/LAST` without `GROUP BY` without other aggregations

```javascript
{
   name: 'aggregate',
   aggregations:  [
    {
      newcolumns: ['first_value2'],
      aggfunction: 'first',
      columns: ['value2']
    }
  ]
}
```
Generates this query: 
```
WITH SELECT_STEP_0 AS (<USER'S QUERY>),
AGGREGATE_STEP_1 AS (SELECT first_value2 FROM (SELECT value2 AS first_value2, ROW_NUMBER() OVER (ORDER BY value2) AS R FROM SELECT_STEP_0 QUALIFY R = 1)) 
SELECT * FROM AGGREGATE_STEP_1
```
- `FIRST/LAST` with a `GROUP BY` without other aggregations

```javascript
{
   name: 'aggregate',
   on: ['column1'],
   aggregations:  [
    {
      newcolumns: ['first_value2'],
      aggfunction: 'first',
      columns: ['value2']
    }
  ]
}
```
Generates this query: 
```
WITH SELECT_STEP_0 AS (<USER'S QUERY>),
AGGREGATE_STEP_1 AS (SELECT first_value2 FROM (SELECT value2 AS first_value2, column1, ROW_NUMBER() OVER (PARTITION BY column1 ORDER BY value2) AS R FROM SELECT_STEP_0 QUALIFY R = 1)) 
SELECT * FROM AGGREGATE_STEP_1
```

- `FIRST/LAST` without `GROUP BY` with another aggregation

```javascript
{
   name: 'aggregate',
   aggregations:  [
    {
      newcolumns: ['sum_value1'],
      aggfunction: 'sum',
      columns: ['value1']
    }
    {
      newcolumns: ['first_value2'],
      aggfunction: 'first',
      columns: ['value2']
    }
  ]
}
```
Generates this query:
```
WITH SELECT_STEP_0 AS (<USER'S QUERY>),
AGGREGATE_STEP_1 AS (SELECT A.*, F.first_value2 FROM (SELECT SUM(value1) AS sum_value1 FROM SELECT_STEP_0) A
INNER JOIN (SELECT value2 FROM (SELECT value2 AS first_value2, ROW_NUMBER() OVER (ORDER BY value2) AS R FROM SELECT_STEP_0 QUALIFY R = 1)) F) SELECT * FROM AGGREGATE_STEP_1
```


- `FIRST/LAST` with `GROUP BY` with another aggregation

```javascript
{
   name: 'aggregate',
   on: ['column1'],
   aggregations:  [
    {
      newcolumns: ['sum_value1'],
      aggfunction: 'sum',
      columns: ['value1']
    }
    {
      newcolumns: ['first_value2'],
      aggfunction: 'first',
      columns: ['value2']
    }
  ]
}
```
Generates this query: 
```
WITH SELECT_STEP_0 AS (<USER'S QUERY>),
AGGREGATE_STEP_1 AS (SELECT A.*, F.first_value2 FROM (SELECT SUM(value1) AS sum_value1 FROM SELECT_STEP_0 GROUP BY column1) A
INNER JOIN (SELECT value2 FROM (SELECT value2 AS first_value2, column1, ROW_NUMBER() OVER (PARTITION BY column1 ORDER BY value2) AS R FROM SELECT_STEP_0 QUALIFY R = 1)) F)  ON
A.column1 = F.column1
SELECT * FROM AGGREGATE_STEP_1
```
