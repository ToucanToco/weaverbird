def build_case(case, when_then_list, else_=None):
    for when, then in when_then_list:
        case = case.when(when, then)

    if else_ is not None:
        case = case.else_(else_)

    return case


def build_analytic(func, partitions=(), orders=()):
    for partition in partitions:
        func = func.over(partition)

    for order, by in orders:
        func = func.orderby(order, order=by)

    return func
