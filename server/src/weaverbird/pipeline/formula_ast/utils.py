from ast import literal_eval


def _escape_quotes(s: str) -> str:
    def iter():
        prev_char = None
        for c in s:
            if c in ('"', "'") and prev_char != "\\":
                yield "\\" + c
            else:
                yield c
            prev_char = c

    return "".join(iter())


def unquote_string(s: str, escape_quotes: bool = True) -> str:
    """Removes surrounding quotes from a string"""
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        try:
            return unquote_string(literal_eval(s), escape_quotes=escape_quotes)
        except SyntaxError:  # Can happen if the string has broken quotes
            pass
    return _escape_quotes(s) if escape_quotes else s
