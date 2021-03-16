import {
  dereferencePipelines,
  getPipelineNamesReferencedBy,
  getPipelineNamesReferencing,
  PipelinesScopeContext,
} from '@/lib/dereference-pipeline';
import { Pipeline } from '@/lib/steps';

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

describe('getPipelineNamesReferencedBy', () => {
  const pipelinesScopeContext: PipelinesScopeContext = {
    dataset1: [{ name: 'domain', domain: 'toto' }],
  };
  describe('given a pipeline name', () => {
    describe('not having an existing reference in the pipelines', () => {
      it('should add the given pipeline name to the results', () => {
        expect(getPipelineNamesReferencedBy('yoyo', pipelinesScopeContext)).toEqual(['yoyo']);
      });
    });
    describe('having the given name is in the pipeline context', () => {
      it("should add the referenced pipeline's name", () => {
        expect(getPipelineNamesReferencedBy('dataset1', pipelinesScopeContext)).toEqual([
          'dataset1',
          'toto',
        ]);
      });
    });
  });
  describe('given a pipeline', () => {
    describe('having a domain step', () => {
      it("should add the referenced pipeline's name", () => {
        expect(
          getPipelineNamesReferencedBy(
            [{ name: 'domain', domain: 'dataset1' }],
            pipelinesScopeContext,
          ),
        ).toEqual(['dataset1', 'toto']);
      });
    });
    describe('having a join step', () => {
      it("should add the referenced pipeline's name", () => {
        expect(
          getPipelineNamesReferencedBy(
            [{ name: 'join', right_pipeline: 'dataset1', on: [['a', 'b']], type: 'left' }],
            pipelinesScopeContext,
          ),
        ).toEqual(['dataset1', 'toto']);
      });
    });
    describe('having a append step', () => {
      it("should add the referenced pipeline's name", () => {
        expect(
          getPipelineNamesReferencedBy(
            [{ name: 'append', pipelines: ['dataset1'] }],
            pipelinesScopeContext,
          ),
        ).toEqual(['dataset1', 'toto']);
      });
    });
    describe('having a none of [domain, append, join] step', () => {
      it('should not alter the given pipeline', () => {
        const pipeline: Pipeline = [{ name: 'argmin', column: 'yoyo' }];
        getPipelineNamesReferencedBy(pipeline, pipelinesScopeContext);
        expect(pipeline).toEqual([{ name: 'argmin', column: 'yoyo' }]);
      });
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
      dataset3: [
        { name: 'domain', domain: 'dummy' },
        { name: 'filter', condition: { column: 'Price', operator: 'ge', value: 1200 } },
      ],
      non_referenced: [
        { name: 'domain', domain: 'dataset1' },
        { name: 'filter', condition: { column: 'Price', operator: 'ge', value: 1200 } },
      ],
    };
    const pipeline: Pipeline = [
      { name: 'domain', domain: 'dataset2' },
      { name: 'append', pipelines: ['dataset1', [{ name: 'domain', domain: 'dataset3' }]] },
    ];

    expect(getPipelineNamesReferencedBy(pipeline, pipelines)).toEqual([
      'dataset2',
      'dataset1',
      'toto',
      'dataset3',
      'dummy',
    ]);
  });
});

describe('getPipelineNamesReferencing', () => {
  it('should handle a complex pipeline (nested dataset)', () => {
    const pipelines: PipelinesScopeContext = {
      toto: [{ name: 'domain', domain: 'lutte' }],
      dataset1: [
        { name: 'domain', domain: 'toto' },
        { name: 'filter', condition: { column: 'Price', operator: 'le', value: 10 } },
      ],
      dataset2: [
        { name: 'domain', domain: 'dataset1' },
        { name: 'filter', condition: { column: 'Price', operator: 'ge', value: 1200 } },
      ],
      dataset3: [
        { name: 'domain', domain: 'dummy' },
        { name: 'filter', condition: { column: 'Price', operator: 'ge', value: 1200 } },
      ],
    };

    expect(getPipelineNamesReferencing('toto', pipelines)).toEqual(['dataset1', 'dataset2']);
  });
});
