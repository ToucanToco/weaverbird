from pandas import Series, to_datetime, to_numeric


def cast_to_float(s: Series) -> Series:
    return to_numeric(s, errors='coerce')  # cast errors will result in NaN values


def cast_to_int(s: Series) -> Series:
    s = cast_to_float(s)
    # Since .astype(int) would fail on NaN values, treat them separately:
    s_integer = s[s.notna()].astype(int)
    s_nan = s[s.isna()]
    return s_integer.append(s_nan).sort_index()


def cast_to_str(s: Series) -> Series:
    return s.astype(str)


def cast_to_datetime(s: Series) -> Series:
    return to_datetime(s, errors='coerce')  # cast errors will result in NaT values


def cast_to_bool(s: Series) -> Series:
    return s.astype(bool)
