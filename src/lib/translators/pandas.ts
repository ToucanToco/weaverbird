import { StepMatcher } from '@/lib/matcher';
import * as S from '@/lib/steps';
import { BaseTranslator } from '@/lib/translators/base';


function repr(value: S.PrimitiveType) {
  if (typeof value === 'boolean') {
    return value ? 'True' : 'False';
  }
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    return `'${value}'`;
  }
  return `datetime(${value.getFullYear()}, ${value.getMonth() + 1}, ${value.getDate()})`;
}


type PandasTransformation = {
  type: 'function';
  stepname: S.PipelineStepName;
  funcname: string;
  code: string;
};

type CodeStatements = {
  type: 'statements';
  code: string;
};

type CodeChunk = PandasTransformation | CodeStatements;

export class PandasTranslator extends BaseTranslator implements StepMatcher<CodeChunk | void> {
  stepno: number;

  constructor() {
    super();
    this.stepno = 0;
  }

  _transform(step: S.PipelineStep, stepno: number, code: string): PandasTransformation {
    const funcname = `step_${stepno.toString().padStart(4, '0')}_${step.name}`;
    return {
      type: 'function',
      stepname: step.name,
      funcname,
      code: `def ${funcname}(df):
    ${code}
    return output_df
`,
    };
  }

  fillna(step: Readonly<S.FillnaStep>) {
    const code = `output_df = df.fillna(value={'${step.column}': ${repr(step.value)})})`;
    return this._transform(step, this.stepno++, code);
  }

  /** transform an 'append' step into corresponding pandas steps */
  rename(step: Readonly<S.RenameStep>) {
    const code = `output_df = df.rename(columns={'${step.oldname}': '${step.newname}'})`;
    return this._transform(step, this.stepno++, code);
  }

  translate(pipeline: S.PipelineStep[]) {
    const transformations = super.translate(pipeline);
    const stmts = transformations.map(t => `    df = ${t.funcname}(df)`);
    const chunks: CodeChunk[] = [
      {type: 'statements', code: 'from datetime import datetime\n\nimport pandas as pd\n'},
      ...transformations,
      {
        type: 'statements',
        code: `def transform(df):
${stmts.join('\n')}
    return df
`,
      }
    ];
    return chunks;
  }
}
