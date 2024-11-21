import argparse
from pathlib import Path
from shutil import rmtree
from typing import Any
from pydantic import BaseModel, Field
import geopandas as gpd
import polars as pl
import json
import yaml
import pandas as pd
import re

from weaverbird.pipeline import Pipeline

class OldFixture(BaseModel):
    exclude: list[str] = Field(default_factory=list)
    input: dict[str, Any] | None = None
    step: dict[str, Any]
    expected: dict[str, Any]


class DatetimeType(BaseModel):
    Datetime: tuple[str, str | None]  # unit and timezone


class Column(BaseModel):
    datatype: str | DatetimeType
    name: str
    values: list[Any]
    

class PolarsDataFrame(BaseModel):
    columns: list[Column]


class NewPipeline(BaseModel):
    steps: list[dict[str, Any]]


class NewFixture(BaseModel):
    input: PolarsDataFrame | None = None
    output: PolarsDataFrame
    pipeline: NewPipeline


def _load_df(spec: dict[str, Any]) -> pd.DataFrame:
    return (
        pd.DataFrame(gpd.read_file(json.dumps(spec["data"])))
        if spec.get("schema") == "geojson"
        else pd.read_json(json.dumps(spec), orient="table")
    )


def _pl_df_info(pl_df: pl.DataFrame) -> dict[str, Any]:
    df = PolarsDataFrame(columns=[])

    for col_name in pl_df.columns:
        col = pl_df[col_name]

        if isinstance(col.dtype, pl.datatypes.Datetime) and col.dtype.time_unit == "ns":
            df.columns.append(Column(
                name = col_name,
                datatype = DatetimeType(Datetime=["ns", None]),
                values = col.dt.timestamp(time_unit="ns").to_list()
            ))
        else:
            df.columns.append(Column(
                name = col_name,
                datatype = str(col.dtype),
                values = col.to_list()
            ))
    return df


def migrate_fixture(old_fixture_path: Path, new_fixture_path: Path) -> bool:
    # kinda bad but I recall we've had a good naming hygiene
    if "pypika" in str(old_fixture_path):
        return False

    print(f"Moving fixture {old_fixture_path}...", end="")
    if ".yml" in str(old_fixture_path) or ".yaml" in str(old_fixture_path):
        old_fixture = OldFixture(**yaml.safe_load(old_fixture_path.read_text()))
    if ".json" in str(old_fixture_path):
        old_fixture = OldFixture(**json.loads(old_fixture_path.read_text()))

    if old_fixture.expected["schema"] == "geojson":
        print("FAILED (geojson not supported)")
        return False

    output_df = _load_df(old_fixture.expected)
    pl_output_df = pl.from_pandas(output_df)

    input = None
    if old_fixture.input is not None:
        input_df = _load_df(old_fixture.input)
        input = _pl_df_info(pl.from_pandas(input_df))

    new_fixture = NewFixture(
        pipeline={
            "steps": rename_props(old_fixture.step["pipeline"])
        },
        input=input,
        output=_pl_df_info(pl_output_df),
    )

    yaml.safe_dump(
        new_fixture.dict(),
        new_fixture_path.open("w"),
        # keep the order of the keys instead of alphabetical order
        sort_keys=False,
    )

    print("DONE")
    return True


def rename_props(old_steps):
    new_steps = []

    for old_step in old_steps:
        new_step = {}

        for prop in old_step.keys():
            new_step[to_camel_case(prop)] = old_step[prop]

        new_steps.append(new_step)

    return new_steps
            

def to_camel_case(prop):
    temp = prop.split('_')
    return temp[0] + ''.join(ele.title() for ele in temp[1:])


def get_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--fixtures-dir", type=str, default="./server/tests/backends/fixtures"
    )
    parser.add_argument("--output-dir", type=str, default="./fixtures")
    return parser.parse_args()


def main() -> None:
    args = get_args()

    old_fixtures_path = Path(args.fixtures_dir)
    new_fixtures_path = Path(args.output_dir)

    # Create main fixtures directory
    new_fixtures_path.mkdir(exist_ok=True)

    (new_fixtures_path / "data").mkdir(exist_ok=True)
    (new_fixtures_path / "schemas").mkdir(exist_ok=True)

    # Create pipeline fixtures subdirectory
    pipelines_tests_path = new_fixtures_path / "pipelines"
    rmtree(pipelines_tests_path, ignore_errors=True)
    pipelines_tests_path.mkdir(exist_ok=True)

    new_tests_path = new_fixtures_path / "steps"
    rmtree(new_tests_path, ignore_errors=True)
    new_tests_path.mkdir(exist_ok=True)

    # Migrate all steps fixtures
    for step_folder in old_fixtures_path.iterdir():
        if not step_folder.is_dir():
            continue

        # Generate all `.yaml` fixtures
        (pipelines_tests_path / step_folder.name).mkdir(exist_ok=True)
        yaml_paths: list[str] = []
        for old_fixture_path in step_folder.iterdir():
            yaml_path = f"{step_folder.name}/{old_fixture_path.stem.replace('_pypika', '')}.yaml" 
            try:
                if migrate_fixture(
                    old_fixture_path,
                    pipelines_tests_path / yaml_path,
                ):
                    yaml_paths.append(yaml_path)
            except Exception as e:
                print()
                print("ERROR", e)


        # Generate the associated `.rs` test
        if not yaml_paths:
            (pipelines_tests_path / step_folder.name).rmdir()
            continue
        test_cases_str = "\n".join(
            f"""// async_test_case!("{yaml_path}", test_polars_step);"""
            for yaml_path in yaml_paths
        )
        with open(new_tests_path / f"{step_folder.name}.rs", "w") as f:
            f.write(
                f"""// FIXME: Remove the clippy allow as soon as at least one test is uncommented
#![allow(unused_imports,dead_code)]
use crate::common::test_polars_step;

use anyhow::Result;
use rstest::rstest;
use test_utils::async_test_case;

{test_cases_str}
"""
            )


if __name__ == "__main__":
    main()