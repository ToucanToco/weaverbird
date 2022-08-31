from __future__ import annotations

import copy

from pydantic import BaseModel


class MetadataError(Exception):
    ...


class ColumnMetadata(BaseModel):
    name: str
    original_name: str | None
    type: str
    original_type: str | None
    alias: str | None

    delete: bool | None = False

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if "name" not in kwargs or "type" not in kwargs:
            raise MetadataError("name is required")
        self.name: str = kwargs["name"].upper()
        self.original_name: str = kwargs["name"]
        self.type: str = kwargs["type"].upper()
        self.original_type: str = kwargs["type"]

    def __eq__(self, other):
        return self.name == other.name and self.type == other.type

    def update_name(self, dest_name: str) -> ColumnMetadata:
        self.name = dest_name.upper()
        return self

    def update_type(self, dest_type: str) -> ColumnMetadata:
        self.type = dest_type.upper()
        return self

    def update(self, column: ColumnMetadata) -> ColumnMetadata:
        self.name = column.name.upper()
        self.type = column.type.upper()
        return self

    def remove(self) -> ColumnMetadata:
        self.delete = True
        return self

    def is_deleted(self):
        return self.delete

    def update_alias(self, alias) -> ColumnMetadata:
        self.alias = alias.upper()
        return self

    def remove_alias(self) -> ColumnMetadata:
        self.alias = None
        return self


class TableMetadata(BaseModel):
    name: str
    original_name: str | None

    delete: bool | None = False

    columns: dict[str, ColumnMetadata] | None = {}

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if "name" not in kwargs:
            raise MetadataError("Name is required")
        self.name: str = kwargs["name"].upper()
        self.original_name: str = kwargs["name"]

    def __eq__(self, other):
        return self.name == other.name

    def update_name(self, table_name: str) -> TableMetadata:
        self.name = table_name.upper()
        return self

    def retrieve_column_by_column_name(
        self, column_name: str, deleted: bool = False
    ) -> ColumnMetadata | None:
        c_name = column_name.upper()
        if c_name in self.columns and (
            (deleted and self.columns[c_name].is_deleted()) or not self.columns[c_name].is_deleted()
        ):
            return self.columns[c_name]
        return None

    def retrieve_columns(self, deleted: bool = False) -> dict[str, ColumnMetadata]:
        l: dict[str, ColumnMetadata] = {}
        for c_name in self.columns:
            if (deleted and self.columns[c_name].is_deleted()) or not self.columns[
                c_name
            ].is_deleted():
                l[c_name] = self.columns[c_name]
        return l

    def retrieve_column_by_type(
        self, column_type: str, deleted: bool = False
    ) -> dict[str, ColumnMetadata]:
        c_type = column_type.upper()
        result: dict[str, ColumnMetadata] = {}
        for c_name, column in self.columns:
            if (
                column.type == c_type
                and (deleted and self.columns[c_name].is_deleted())
                or not self.columns[c_name].is_deleted()
            ):
                result[c_name] = column
        return result

    def add_column_o(self, column: ColumnMetadata) -> TableMetadata:
        c_name = column.name.upper()
        self.columns[c_name] = column
        return self

    def add_columns_o(self, columns: list[ColumnMetadata]) -> TableMetadata:
        for c in columns:
            self.add_column_o(column=c)
        return self

    def add_column(
        self, column_name: str, column_type: str, alias: str | None = None
    ) -> TableMetadata:
        c = ColumnMetadata(name=column_name, type=column_type, alias=alias)
        self.add_column_o(c)
        return self

    def add_columns(self, columns: dict[str, str]) -> TableMetadata:
        for k, v in columns.items():
            self.add_column(column_name=k, column_type=v)
        return self

    def update_column_name(self, column_name: str, dest_column_name: str) -> TableMetadata:
        c_name = column_name.upper()
        if c_name not in self.columns:
            raise MetadataError(f"Error to update column {c_name}({column_name}), column not exist")
        result = self.columns[c_name].update_name(dest_column_name)
        del self.columns[c_name]
        self.columns[result.name] = result
        return self

    def update_column_type(self, column_name: str, dest_column_type: str) -> ColumnMetadata:
        c_name = column_name.upper()
        if c_name not in self.columns:
            raise MetadataError(f"Error to update column {c_name}({column_name}), column not exist")
        self.columns[c_name] = self.columns[c_name].update_type(dest_column_type)
        return self.columns[c_name]

    def update_column_alias(self, column_name, alias) -> ColumnMetadata:
        c_name = column_name.upper()
        if c_name not in self.columns:
            raise MetadataError(
                f"Error updating column {c_name}({column_name}), column does not exist"
            )
        self.columns[c_name] = self.columns[c_name].update_alias(alias)
        return self

    def remove_column(self, column_name: str) -> None:
        c_name = column_name.upper()
        if c_name in self.columns:
            self.columns[c_name].remove()
        # else warn that column does not exist

    def remove_columns(self, columns_name: list[str]) -> int:
        i = 0
        for name in columns_name:
            c_name = name.upper()
            if c_name not in self.columns:
                raise MetadataError(f"Error to delete column {c_name}({name}), column not exist")
            self.columns[c_name].remove()
            i += 1
        return i

    def remove_all_columns(self) -> int:
        i = len(self.columns)
        self.columns = {}
        return i

    def remove(self) -> TableMetadata:
        self.delete = True
        return self

    def remove_column_alias(self, column_name: str) -> TableMetadata:
        if column_name not in self.columns:
            raise MetadataError(f"Error updating column {column_name}), column does not exist")
        self.columns[column_name].remove_alias()
        return self

    def is_deleted(self) -> bool:
        return self.delete


class SqlQueryMetadataManager(BaseModel):
    tables: dict[str, TableMetadata] | None

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

        self.tables = {"__INTERNAL__": TableMetadata(name="__INTERNAL__")}
        if "tables_metadata" in kwargs:
            first = True
            for table_name in kwargs["tables_metadata"]:
                table = self.create_table(table_name)
                for column in kwargs["tables_metadata"][table_name]:
                    table.add_column(column, kwargs["tables_metadata"][table_name][column])
                if first:
                    self.define_as_metadata(table_name)
                    first = False

    def _check_name(self, name) -> bool:
        if name == "__INTERNAL__":
            raise MetadataError("Table __INTERNAL__ is reserved")
        return True

    def define_as_metadata(self, table_name: str) -> SqlQueryMetadataManager:
        t_name = table_name.upper()
        if t_name not in self.tables and self._check_name(t_name):
            raise MetadataError(
                f"Impossible to define table {t_name}({table_name}) - Table does not exist"
            )
        self.tables["__INTERNAL__"] = copy.deepcopy(self.tables[t_name])
        self.tables["__INTERNAL__"].original_name = table_name
        return self

    def create_table(self, table_name: str) -> TableMetadata:
        t_name = table_name.upper()

        # just a quick fix for the join, not good for now
        # TODO : Find a better way to manage the behaviour of join two tables with the same name
        # if t_name in self.tables and self._check_name(t_name):
        #     raise MetadataError(f'Table {t_name}({table_name}) already exist')

        self.tables[t_name] = TableMetadata(name=table_name)
        return self.tables[t_name]

    def remove_table(self, table_name: str) -> SqlQueryMetadataManager:
        t_name = table_name.upper()
        if t_name not in self.tables and self._check_name(t_name):
            raise MetadataError(
                f"Impossible to remove table {t_name}({table_name}) - Table does not exist"
            )
        self.tables[t_name] = self.tables[t_name].remove()
        return self

    def remove_tables(self) -> SqlQueryMetadataManager:
        self.tables = {}
        return self

    def update_table(self, table_name: str, dest_table_name: str) -> SqlQueryMetadataManager:
        t_name = table_name.upper()
        if t_name not in self.tables and self._check_name(t_name):
            raise MetadataError(f"Table {t_name}({table_name}) not exist")
        result = self.tables[t_name].update_name(dest_table_name)
        del self.tables[t_name]
        self.tables[result.name] = result
        return self

    def duplicate_table(
        self, src_table: TableMetadata, dst_table_name: str
    ) -> SqlQueryMetadataManager:
        t_name = dst_table_name.upper()

        # just a quick fix for the join, not good for now
        # TODO : Find a better way to manage the behaviour of join two tables with the same name
        # if dst_table_name in self.tables:
        #     raise MetadataError(f'Table {t_name}({dst_table_name}) already exist')

        self.create_table(t_name)
        self.tables[t_name] = copy.deepcopy(src_table)
        return self

    def join_query_metadata(self, join_table: str, left_query_name: str) -> SqlQueryMetadataManager:
        jt_name: str = join_table.upper()
        if jt_name not in self.tables:
            raise MetadataError(
                f"Impossible to merge table {jt_name}({join_table}) - Table not exist"
            )
        self.create_table(table_name="__TEMP_JOIN__")

        for cname in self.retrieve_query_metadata_columns():
            self.add_table_column(
                table_name="__TEMP_JOIN__",
                column_name=f"{left_query_name}.{cname}",
                column_type=self.retrieve_query_metadata_column_by_name(cname).type,
                alias=f"{cname}_LEFT",
            )
        self.define_as_metadata(table_name="__TEMP_JOIN__")

        for cname in self.tables[jt_name].columns:
            self.add_query_metadata_column(
                column_name=f"{jt_name}.{cname}",
                column_type=self.retrieve_column_by_name(
                    table_name=jt_name, column_name=cname
                ).type,
                alias=f"{cname}_RIGHT",
            )

        return self

    def append_queries_metadata(self, unioned_tables: list[str]) -> SqlQueryMetadataManager:
        try:
            all_columns = [self.retrieve_columns_as_list(t) for t in unioned_tables]
            all_columns.sort(key=len)
            max_column_number = max(len(cl) for cl in all_columns)
        except ValueError:
            raise MetadataError("Impossible to append tables - Table does not exist")

        new_table = TableMetadata(name="__INTERNAL__")
        new_table.original_name = self.tables["__INTERNAL__"].original_name
        new_table.columns = self.retrieve_query_metadata_columns()
        if len(new_table.columns) < max_column_number:
            index_cols_to_add = range(len(new_table.columns), max_column_number)
            for cols in all_columns:
                for index in index_cols_to_add:
                    if index < len(cols):
                        new_table.add_column(
                            column_name=f"NULL AS {cols[index]}", column_type="UNDEFINED"
                        )
        self.tables["__INTERNAL__"] = new_table
        return self

    def add_table_column(
        self, table_name: str, column_name: str, column_type: str, alias: str | None = None
    ) -> TableMetadata:
        t_name = table_name.upper()
        if t_name not in self.tables:
            raise MetadataError(
                f"Impossible to update column name, table {t_name}({table_name}) not exist"
            )
        self.tables[t_name] = self.tables[t_name].add_column(column_name, column_type, alias)
        return self.tables[t_name]

    def add_table_columns_from_dict(self, table_name: str, columns_dict: dict[str, str]):
        t_name = table_name.upper()
        if t_name not in self.tables:
            raise MetadataError(
                f"Impossible to update column name, table {t_name}({table_name}) does not exist"
            )
        for name, type in columns_dict.items():
            self.tables[t_name] = self.tables[t_name].add_column(name, type)

    def add_query_metadata_column(
        self, column_name: str, column_type: str, alias: str | None = None
    ) -> TableMetadata:
        return self.add_table_column("__INTERNAL__", column_name, column_type, alias)

    def add_query_metadata_columns(self, columns: dict[str, str]) -> TableMetadata:
        return self.add_table_columns_from_dict("__INTERNAL__", columns)

    def update_column_name(
        self, table_name: str, column_name: str, dest_column_name: str
    ) -> TableMetadata:
        t_name = table_name.upper()
        if t_name not in self.tables:
            raise MetadataError(
                f"Impossible to update column name, table {t_name}({table_name}) not exist"
            )
        self.tables[t_name] = self.tables[t_name].update_column_name(column_name, dest_column_name)
        return self.tables[t_name]

    def update_column_alias(self, table_name: str, column_name: str, alias: str) -> TableMetadata:
        t_name = table_name.upper()
        if t_name not in self.tables:
            raise MetadataError(
                f"Impossible to update column's alias, table {t_name}({table_name}) does not exist"
            )
        self.tables[t_name] = self.tables[t_name].update_column_alias(column_name, alias)
        return self.tables[t_name]

    def remove_column_alias(self, table_name: str, column_name: str) -> TableMetadata:
        if table_name not in self.tables:
            raise MetadataError(
                f"Impossible to remove column's alias, table {table_name} does not exist"
            )
        self.tables[table_name] = self.tables[table_name].remove_column_alias(column_name)
        return self.tables[table_name]

    def update_query_metadata_column_name(
        self, column_name: str, dest_column_name: str
    ) -> TableMetadata:
        self.update_column_name("__INTERNAL__", column_name, dest_column_name)
        return self.retrieve_table("__INTERNAL__")

    def update_query_metadata_column_alias(self, column_name: str, alias: str):
        self.update_column_alias("__INTERNAL__", column_name, alias)
        return self.retrieve_table("__INTERNAL__")

    def update_column_type(
        self, table_name: str, column_name: str, dest_column_type: str
    ) -> TableMetadata:
        t_name = table_name.upper()
        if t_name not in self.tables:
            raise MetadataError(
                f"Impossible to update column type, table {t_name}({table_name}) not exist"
            )
        self.tables[t_name].update_column_type(column_name, dest_column_type)
        return self.retrieve_table("__INTERNAL__")

    def update_query_metadata_column_type(
        self, column_name: str, dest_column_type: str
    ) -> TableMetadata:
        self.update_column_type("__INTERNAL__", column_name, dest_column_type)
        return self.retrieve_table("__INTERNAL__")

    def remove_table_column(self, table_name: str, column_name: str) -> TableMetadata:
        t_name = table_name.upper()
        if t_name not in self.tables:
            raise MetadataError(
                f"Impossible to delete column, table {t_name}({table_name}) does not exist"
            )
        self.tables[t_name].remove_column(column_name)
        return self.tables[t_name]

    def remove_query_metadata_column(self, column_name: str) -> TableMetadata:
        return self.remove_table_column("__INTERNAL__", column_name)

    def remove_query_metadata_column_alias(self, column_name: str) -> TableMetadata:
        return self.remove_column_alias("__INTERNAL__", column_name)

    def remove_table_columns(self, table_name: str, columns_name: list[str]) -> TableMetadata:
        t_name = table_name.upper()
        if t_name not in self.tables:
            raise MetadataError(
                f"Impossible to delete column, table {t_name}({table_name}) does not exist"
            )
        self.tables[t_name].remove_columns(columns_name)
        return self.tables[t_name]

    def remove_query_metadata_columns(self, columns_name: list[str]) -> TableMetadata:
        return self.remove_table_columns("__INTERNAL__", columns_name)

    def remove_table_all_columns(self, table_name: str) -> int:
        t_name = table_name.upper()
        if t_name not in self.tables:
            raise MetadataError(
                f"Impossible to delete column, table {t_name}({table_name}) does not exist"
            )
        return self.tables[t_name].remove_all_columns()

    def remove_query_metadata_all_columns(self) -> int:
        return self.remove_table_all_columns("__INTERNAL__")

    def retrieve_table(self, table_name: str, deleted: bool = False) -> TableMetadata | None:
        t_name = table_name.upper()
        if t_name in self.tables and (
            (deleted and self.tables[t_name].is_deleted()) or not self.tables[t_name].is_deleted()
        ):
            return self.tables[t_name]
        return None

    def retrieve_query_metadata(self) -> TableMetadata:
        return self.retrieve_table("__INTERNAL__")

    def retrieve_table_columns(
        self, table_name: str, deleted: bool = False
    ) -> dict[str, ColumnMetadata]:
        t_name = table_name.upper()
        if t_name not in self.tables:
            raise MetadataError(
                f"Impossible to retrieve column for table {t_name}({table_name}) - Table does not exist"
            )
        return self.tables[t_name].retrieve_columns(deleted)

    def retrieve_query_metadata_columns(self, deleted: bool = False) -> dict[str, ColumnMetadata]:
        return self.retrieve_table_columns("__INTERNAL__", deleted)

    def retrieve_columns_as_list(
        self, table_name: str, columns_filter: list[str] = None, deleted: bool = False
    ) -> list[str]:
        columns = self.retrieve_table_columns(table_name, deleted)
        filter_format = []
        if columns_filter is not None:
            filter_format = [f.upper() for f in columns_filter]
        result: list[str] = []
        for name, column_metadata in columns.items():
            if name not in filter_format:
                alias = getattr(column_metadata, "alias")
                if alias:
                    result.append(f"{name} AS {alias}")
                else:
                    result.append(name)
        return result

    def retrieve_columns_as_str(
        self, table_name: str, columns_filter: list[str] = None, deleted: bool = False
    ) -> str:
        return ", ".join(
            self.retrieve_columns_as_list(
                table_name, columns_filter=columns_filter, deleted=deleted
            )
        )

    def retrieve_query_metadata_columns_as_str(
        self, columns_filter: list[str] = None, deleted: bool = False
    ) -> str:
        return ", ".join(
            self.retrieve_columns_as_list(
                "__INTERNAL__", columns_filter=columns_filter, deleted=deleted
            )
        )

    def retrieve_query_metadata_columns_as_list(
        self, columns_filter: list[str] = None, deleted: bool = False
    ) -> list[str]:
        return self.retrieve_columns_as_list(
            "__INTERNAL__", columns_filter=columns_filter, deleted=deleted
        )

    def retrieve_column_by_name(
        self, table_name: str, column_name: str, deleted: bool = False
    ) -> ColumnMetadata:
        t_name = table_name.upper()
        if t_name not in self.tables:
            raise MetadataError(
                f"Impossible to retrieve column for table {t_name}({table_name}) - Table does not exist"
            )
        return self.tables[t_name].retrieve_column_by_column_name(column_name, deleted)

    def retrieve_query_metadata_column_by_name(self, column_name: str) -> ColumnMetadata:
        return self.retrieve_column_by_name("__INTERNAL__", column_name)

    def retrieve_query_metadata_column_type_by_name(self, column_name: str) -> str:
        return (
            self.retrieve_column_by_name("__INTERNAL__", column_name).type
            if hasattr(self.retrieve_column_by_name("__INTERNAL__", column_name), "type")
            else "UNDEFINED"
        )

    def retrieve_columns_by_type(
        self, table_name: str, column_type: str, deleted: bool = False
    ) -> dict[str, ColumnMetadata]:
        t_name = table_name.upper()
        if t_name not in self.tables:
            raise MetadataError(
                f"Impossible to retrieve column for table {t_name}({table_name}) - Table does not exist"
            )
        return self.tables[t_name].retrieve_column_by_type(column_type, deleted)

    def retrieve_query_metadata_column_by_type(self, column_type: str) -> dict[str, ColumnMetadata]:
        return self.retrieve_columns_by_type("__INTERNAL__", column_type)

    def cast_column_to_string(self, columns: dict[str, ColumnMetadata]):
        return ", ".join([cname for cname, column in columns])

    def update_query_metadata_column_names_with_alias(self):
        for col in self.retrieve_query_metadata_columns().values():
            if col.alias:
                self.update_query_metadata_column_name(
                    column_name=col.name,
                    dest_column_name=col.alias,
                )
                self.remove_query_metadata_column_alias(col.alias)
        return self.retrieve_table("__INTERNAL__")

    def rename_union_columns(self):
        union_columns = self.retrieve_query_metadata_columns()
        [
            self.update_query_metadata_column_name(cname, cname.split(" ")[-1])
            for cname in union_columns.keys()
            if "NULL" in cname
        ]
        return self
