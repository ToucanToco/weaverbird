from typing import Any


class WeaverbirdError(Exception):
    """Base class for weaverbird exceptions"""


class DuplicateError(WeaverbirdError):
    """Raised when an operation encountered duplicates where it was forbidden"""


class DuplicateColumnError(Exception):
    """raised when duplicate column names in input"""


class UnresolvedReferenceError(Exception):
    """Raised when a join step as a reference instead of a pipeline in input"""


class MissingColumnNameError(WeaverbirdError):
    """Raised when defining a substring but did not supply a new column name"""


class MissingTableNameError(WeaverbirdError):
    """Raised when defining a custom SQL query but didn't set a proper temporary table name"""


class PipelineFailure(WeaverbirdError):
    """Raised when an error happens on the pipeline"""

    def __init__(
        self,
        original_exception: Exception,
        step_name: str | None = None,
        step_config: dict[str, Any] | None = None,
        index: int | None = None,
    ):
        self.details: dict[str, Any] = {}
        if step_name and index:
            self.message = f"Step #{index + 1} ({step_name}) failed: {original_exception}"
            self.details["index"] = index
            self.details["step_config"] = step_config
        else:
            self.message = f"Internal failure: {original_exception}"
        self.details["message"] = self.message
        super().__init__(self.message, self.details)


class PipelineTranslationFailure(PipelineFailure):
    """Raised when an error happens during the translation of the pipeline"""
