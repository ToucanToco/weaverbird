from toucan_connectors.common import nosql_apply_parameters_to_query


def nosql_apply_parameters_to_query_with_errors(
    query: dict | list[dict] | tuple | str, parameters: dict | None, **kwargs
):
    """
    When a variable is missing, it may lead to undefined values and therefore pydantic validation errors.
    Instead, we want UndefinedVariableError so we force `handle_errors=True` which does exactly this.
    """
    return nosql_apply_parameters_to_query(query, parameters, handle_errors=True, **kwargs)
