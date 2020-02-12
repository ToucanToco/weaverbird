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
  interface OperatorNode {
    type: 'OperatorNode';
    fn: string;
    op: string;
    args: MathNode[];
    traverse: function;
  }

  interface ConstantNode {
    type: 'ConstantNode';
    value: number;
    traverse: function;
  }

  interface SymbolNode {
    type: 'SymbolNode';
    name: string;
    traverse: function;
  }

  interface ParenthesisNode {
    type: 'ParenthesisNode';
    content: MathNode;
    traverse: function;
  }

  type MathNode = OperatorNode | ConstantNode | SymbolNode | ParenthesisNode;
  function parse(expr: string): MathNode;
}
