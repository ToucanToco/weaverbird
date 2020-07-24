import { Pipeline } from '@/lib/steps';
import { dereferencePipelines, PipelinesScopeContext } from '@/store/state';

describe('dereferencePipelines', () => {
  it('should let unmodified pipeline that are not referenced', () => {
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'jjg' },
      { name: 'filter', condition: { column: 'Price', operator: 'ge', value: 1200 } },
    ];
    expect(dereferencePipelines(pipeline, {})).toStrictEqual(pipeline);
  });

  describe('dereference "append" step', () => {
    it('should replace a domain into a pipeline', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'tutu' },
        { name: 'append', pipelines: ['toto'] },
      ];
      const dererefencedPipeline: Pipeline = [
        { name: 'domain', domain: 'tutu' },
        { name: 'append', pipelines: [[{ name: 'domain', domain: 'toto' }]] },
      ];
      expect(dereferencePipelines(pipeline, {})).toStrictEqual(dererefencedPipeline);
    });

    it('should replace a pipeline domain with selected dereferenced pipeline', () => {
      const pipelines: PipelinesScopeContext = { dataset1: [{ name: 'domain', domain: 'toto' }] };
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'tutu' },
        { name: 'append', pipelines: ['dataset1'] },
      ];

      const dererefencedPipeline: Pipeline = [
        { name: 'domain', domain: 'tutu' },
        { name: 'append', pipelines: [pipelines['dataset1']] },
      ];
      expect(dereferencePipelines(pipeline, pipelines)).toStrictEqual(dererefencedPipeline);
    });
  });

  describe('dereference "join" step', () => {
    it('should replace a domain into a pipeline', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'tutu' },
        { name: 'join', right_pipeline: 'jjg', type: 'left', on: [['t'], ['t']] },
      ];
      const dererefencedPipeline: Pipeline = [
        { name: 'domain', domain: 'tutu' },
        {
          name: 'join',
          right_pipeline: [{ name: 'domain', domain: 'jjg' }],
          type: 'left',
          on: [['t'], ['t']],
        },
      ];
      expect(dereferencePipelines(pipeline, {})).toStrictEqual(dererefencedPipeline);
    });

    it('should replace a pipeline domain with selected dereferenced pipeline', () => {
      const pipelines: PipelinesScopeContext = { dataset1: [{ name: 'domain', domain: 'toto' }] };
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'tutu' },
        { name: 'join', right_pipeline: 'dataset1', type: 'left', on: [['t'], ['t']] },
      ];

      const dererefencedPipeline: Pipeline = [
        { name: 'domain', domain: 'tutu' },
        {
          name: 'join',
          right_pipeline: pipelines['dataset1'],
          type: 'left',
          on: [['t'], ['t']],
        },
      ];
      expect(dereferencePipelines(pipeline, pipelines)).toStrictEqual(dererefencedPipeline);
    });
  });

  describe('dereference "domain" step', () => {
    it('should keep domain intact if not a pipeline', () => {
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'tutu' },
        { name: 'filter', condition: { column: 'Price', operator: 'ge', value: 1200 } },
      ];
      expect(dereferencePipelines(pipeline, {})).toStrictEqual(pipeline);
    });
    it('should replace pipeline domain with selected dereferenced pipeline steps', () => {
      const pipelines: PipelinesScopeContext = {
        dataset1: [
          { name: 'domain', domain: 'toto' },
          { name: 'filter', condition: { column: 'Price', operator: 'le', value: 10 } },
        ],
      };
      const pipeline: Pipeline = [
        { name: 'domain', domain: 'dataset1' },
        { name: 'filter', condition: { column: 'Price', operator: 'ge', value: 1200 } },
      ];

      const dererefencedPipeline: Pipeline = [
        { name: 'domain', domain: 'toto' },
        { name: 'filter', condition: { column: 'Price', operator: 'le', value: 10 } },
        { name: 'filter', condition: { column: 'Price', operator: 'ge', value: 1200 } },
      ];
      expect(dereferencePipelines(pipeline, pipelines)).toStrictEqual(dererefencedPipeline);
    });
  });

  it('should handle a complex pipeline (nested dataset)', () => {
    const pipelines: PipelinesScopeContext = {
      dataset1: [
        { name: 'domain', domain: 'toto' },
        { name: 'filter', condition: { column: 'Price', operator: 'le', value: 10 } },
      ],
      dataset2: [
        { name: 'domain', domain: 'dataset1' },
        { name: 'filter', condition: { column: 'Price', operator: 'ge', value: 1200 } },
      ],
    };
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'dataset2' },
      { name: 'append', pipelines: ['dataset1'] },
    ];

    const dererefencedPipeline: Pipeline = [
      { name: 'domain', domain: 'toto' },
      { name: 'filter', condition: { column: 'Price', operator: 'le', value: 10 } },
      { name: 'filter', condition: { column: 'Price', operator: 'ge', value: 1200 } },
      { name: 'append', pipelines: [pipelines['dataset1']] },
    ];
    expect(dereferencePipelines(pipeline, pipelines)).toStrictEqual(dererefencedPipeline);
  });
});
