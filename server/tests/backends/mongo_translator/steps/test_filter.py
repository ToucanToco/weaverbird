# test

from weaverbird.backends.mongo_translator.steps.filter import build_match_tree
from weaverbird.pipeline.conditions import MatchCondition


def test_build_match_tree():
    assert build_match_tree(MatchCondition(column="test", operator="matches", value="test")) == {
        "test": {"$options": "i", "$regex": "test"}
    }

    assert build_match_tree(MatchCondition(column="test", operator="notmatches", value="test")) == {
        "test": {"$not": {"$options": "i", "$regex": "test"}}
    }
