/**
 * type declaration for the mathjs module
 *
 * We decide not to use the standard one because of the lack of precision
 * on node interfaces. This type declaration concentrates purely on what
 * we need therefore the vast majority of the `mathjs` API is not covered here.
 */
export = mathjs;

declare namespace mathjs {
  /**
   * Math nodes interfaces to build formula logical trees
   */
  class BaseNode {
    traverse: function;
    transform: function;
    type: string;
  }

  class OperatorNode extends BaseNode {
    type: 'OperatorNode';
    fn: string;
    op: string;
    args: MathNode[];
  }

  class ConstantNode extends BaseNode {
    constructor(value: number | string);

    type: 'ConstantNode';
    value: number | string;
  }

  class SymbolNode extends BaseNode {
    type: 'SymbolNode';
    name: string;
  }

  class ParenthesisNode extends BaseNode{
    type: 'ParenthesisNode';
    content: MathNode;
  }

  type MathNode = OperatorNode | ConstantNode | SymbolNode | ParenthesisNode;
  function parse(expr: string): MathNode;
}
