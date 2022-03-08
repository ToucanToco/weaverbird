from re import sub


def column_to_user_variable(col_name: str) -> str:
    """User variable names can contain the ascii characters [_a-zA-Z0-9] and any non-ascii character."""
    col_name_without_invalid_chars = sub(r'/[^_a-zA-Z0-9]/g', '_', col_name)
    return f'vqb_{col_name_without_invalid_chars}'
