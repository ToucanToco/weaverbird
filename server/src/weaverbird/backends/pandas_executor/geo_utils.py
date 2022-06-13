import geopandas as gpd
import pandas as pd


class UnsupportedGeoOperation(Exception):
    def __init__(self, msg: str) -> None:
        super().__init__(f'Unsupported Geo operation: {msg}')


def df_to_geodf(df: pd.DataFrame) -> gpd.GeoDataFrame:
    if not (isinstance(df, gpd.GeoDataFrame) and hasattr(df, 'geometry')):
        raise UnsupportedGeoOperation("df must be a GeoDataFrame and 'geometry' must be set")

    try:
        return gpd.GeoDataFrame(df)
    except Exception as exc:
        raise UnsupportedGeoOperation(
            f'Could not convert DataFrame to GeoDataFrame: {exc}'
        ) from exc
