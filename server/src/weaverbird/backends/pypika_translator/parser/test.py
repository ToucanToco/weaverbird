
from weaverbird.backends.pypika_translator.parser.evaluator import ExpressionEvaluator


tables = [("foo", "foo"), ("bar", "b")]
evaluator = ExpressionEvaluator(tables)
result = evaluator.eval("foo.test = 1")

print(result)  # "foo"."fizz"=1'
type(result)   # pypika.terms.BasicCriterion

result = evaluator.eval("bar.fizz = 1")
print(result)  # "b"."fizz"=1'
type(result)   # pypika.terms.BasicCriterio
