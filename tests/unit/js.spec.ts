import { getTranslator } from '@/lib/translators';
import {execute, JavaScriptTranslator, DataTable, DataDomains} from '@/lib/translators/js';
import {Pipeline} from "@/lib/steps";

describe('Pipeline to js function translator', () => {
  const jsTranslator = getTranslator('js') as JavaScriptTranslator;
  const SAMPLE_DATA: DataDomains = {
    domainA: [
      {label: 'A', value: 1},
      {label: 'B', value: 2}
    ],
    domainB: [
      {label: 'alpha', value: 0.1},
      {label: 'beta', value: 0.2}
    ]
  }

  function expectResultFromPipeline(pipeline: Pipeline, data: DataDomains, expectedResult: DataTable) {
    expect(execute(data, jsTranslator.translate(pipeline))).toEqual(expectedResult);
  }

  it('can handle domain steps', () => {
    expectResultFromPipeline(
      [{ name: 'domain', domain: 'domainA' }],
      SAMPLE_DATA,
      [
      {label: 'A', value: 1},
      {label: 'B', value: 2}
    ]);
    expectResultFromPipeline(
      [{ name: 'domain', domain: 'domainB' }],
      SAMPLE_DATA,
      [
      {label: 'alpha', value: 0.1},
      {label: 'beta', value: 0.2}
    ]);
  });
});
