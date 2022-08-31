import geopandas as gpd
import pandas as pd


class UnsupportedGeoOperation(Exception):
    def __init__(self, msg: str) -> None:
        super().__init__(f"Unsupported Geo operation: {msg}")


def df_to_geodf(df: pd.DataFrame) -> gpd.GeoDataFrame:
    if not (isinstance(df, pd.DataFrame) and hasattr(df, "geometry")):
        raise UnsupportedGeoOperation("df must be a DataFrame and 'geometry' must be set")

    # Checking this second because we can have a GeoDataFrame without geometry
    if isinstance(df, gpd.GeoDataFrame):
        return df

    try:
        return gpd.GeoDataFrame(df)
    except Exception as exc:
        raise UnsupportedGeoOperation(
            f"Could not convert DataFrame to GeoDataFrame: {exc}"
        ) from exc
