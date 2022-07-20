import abc
from typing import TYPE_CHECKING

from pypika.enums import Comparator
from pypika.queries import Field
from pypika.terms import BasicCriterion

if TYPE_CHECKING:
    from pypika.queries import Criterion

    from weaverbird.pipeline.conditions import MatchCondition


class RegexpMatchingComparator(Comparator):
    SIMILAR_TO = " SIMILAR TO "
    NOT_SIMILAR_TO = " NOT SIMILAR TO "
    CONTAINS = " CONTAINS "
    NOT_CONTAINS = " NOT CONTAINS "


class AbstractRegexMatchingCriterionBuilder(abc.ABC):
    @staticmethod
    @abc.abstractmethod
    def _escape_regex(r: str) -> str:
        """Escapes a regex to match the entire string if required by the target SQL engine"""
        return r

    @abc.abstractmethod
    def _matches_operation(self, condition: 'MatchCondition', column_field: Field) -> 'Criterion':
        """Builds a selectable for the given match condition"""

    def _not_matches_operation(
        self, condition: 'MatchCondition', column_field: Field
    ) -> 'Criterion':
        """Builds a selectable for the given not matches condition"""
        return self._matches_operation(condition, column_field).negate()


class RegexPercentEscapeMixin(AbstractRegexMatchingCriterionBuilder):
    @staticmethod
    def _escape_regex(r: str) -> str:
        return f'%{r}%'


class RegexWildcardEscapeMixin(AbstractRegexMatchingCriterionBuilder):
    @staticmethod
    def _escape_regex(r: str) -> str:
        return f'.*{r}.*'


class RegexNoEscapeMixin(AbstractRegexMatchingCriterionBuilder):
    @staticmethod
    def _escape_regex(r: str) -> str:
        return r


class RegexRegexpCriterionBuilder(AbstractRegexMatchingCriterionBuilder):
    """Mixin for classes using the SIMILAR TO operator"""

    def _matches_operation(self, condition: 'MatchCondition', column_field: Field) -> 'Criterion':
        return column_field.regexp(self._escape_regex(condition.value))


class RegexSimilarToCriterionBuilder(AbstractRegexMatchingCriterionBuilder):
    """Mixin for classes using the SIMILAR TO operator"""

    def _matches_operation(self, condition: 'MatchCondition', column_field: Field) -> 'Criterion':
        """Builds a selectable for the given match condition"""
        return BasicCriterion(
            RegexpMatchingComparator.SIMILAR_TO,
            column_field,
            column_field.wrap_constant(self._escape_regex(condition.value)),
        )
