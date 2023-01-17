# hack to make linter not complain. this is copied from sly.lex.LexerMeta.__prepare__
def _(pattern, *extra):
    patterns = [pattern, *extra]

    def decorate(func):
        pattern = "|".join(f"({pat})" for pat in patterns)
        if hasattr(func, "pattern"):
            func.pattern = pattern + "|" + func.pattern
        else:
            func.pattern = pattern
        return func

    return decorate
