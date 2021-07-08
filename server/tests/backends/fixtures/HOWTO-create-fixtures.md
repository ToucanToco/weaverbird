# How to extract fixtures from existing tests

Add a few snippets to make fixtures from existing tests:

```python
def test_case():
    df = ...
    expected_result = ...
    ...
    
    step = SomeStep(...)
    
    # Extract step into a file
    with open('../backends/fixtures/<stepname>/<case_name>.step.json', 'w') as f:
        f.write(json.dumps(step.dict(by_alias=True), indent=2))

    ...
        
    # Extract the dataframes
    df.to_json(
        '../backends/fixtures/<stepname>/<case_name>/missing_date.in.json',
        orient='table',
        indent=2,
        index=False,
    )
    expected_result.to_json(
        '../backends/fixtures/<stepname>/<case_name>/missing_date.out.json',
        orient='table',
        indent=2,
        index=False,
    )
```

TODO:
- multiple input dataframes (combinations)
when other backends will be available:
- skip/only for a backend
- specific out file for a backend
