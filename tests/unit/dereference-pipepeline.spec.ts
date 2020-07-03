import { dereferencePipelines, PipelinesScopeContext } from '@/store/state';

const pipelines: PipelinesScopeContext = {
  lala: [
    { name: 'source', source: 'jjg' },
    {
      name: 'filter',
      condition: {
        column: 'Price',
        operator: 'ge',
        value: 1200,
      },
    },
  ],
  append_p: [
    { name: 'source', source: 'jjg' },
    {
      name: 'append',
      pipelines: ['lala'],
    },
  ],
  append_s: [
    { name: 'source', source: 'jjg' },
    {
      name: 'append',
      pipelines: ['jjg'],
    },
  ],
  join_p: [
    { name: 'source', source: 'mika' },
    {
      name: 'join',
      right_pipeline: 'lala',
      type: 'left',
      on: [['froufrou'], ['froufrou']],
    },
  ],
  join_s: [
    { name: 'source', source: 'mika' },
    {
      name: 'join',
      right_pipeline: 'jjg',
      type: 'left',
      on: [['froufrou'], ['froufrou']],
    },
  ],
  domain_p: [{ name: 'domain', domain: 'lala' }],
  domain_s: [{ name: 'domain', domain: 'mika' }],
};

const sources = ['jjg', 'mika'];

describe('dereferencePipelines', () => {
  it('should let unmodified pipeline that are not referenced', () => {
    expect(dereferencePipelines(pipelines['lala'], pipelines, sources)).toStrictEqual(
      pipelines['lala'],
    );
  });

  describe('dereference "append" step', () => {
    it('should dereferenced "append" step into a pipeline', () => {
      expect(dereferencePipelines(pipelines['append_p'], pipelines, sources)).toStrictEqual([
        { name: 'source', source: 'jjg' },
        {
          name: 'append',
          pipelines: [pipelines['lala']],
        },
      ]);
    });

    it('should dereferenced "append" step into a source', () => {
      expect(dereferencePipelines(pipelines['append_s'], pipelines, sources)).toStrictEqual([
        { name: 'source', source: 'jjg' },
        {
          name: 'append',
          pipelines: [[{ name: 'source', source: 'jjg' }]],
        },
      ]);
    });
  });

  describe('dereference "join" step', () => {
    it('should dereferenced "join" step into a pipeline', () => {
      expect(dereferencePipelines(pipelines['join_p'], pipelines, sources)).toStrictEqual([
        { name: 'source', source: 'mika' },
        {
          name: 'join',
          right_pipeline: pipelines['lala'],
          type: 'left',
          on: [['froufrou'], ['froufrou']],
        },
      ]);
    });

    it('should dereferenced "join" step into a source', () => {
      expect(dereferencePipelines(pipelines['join_s'], pipelines, sources)).toStrictEqual([
        { name: 'source', source: 'mika' },
        {
          name: 'join',
          right_pipeline: [{ name: 'source', source: 'jjg' }],
          type: 'left',
          on: [['froufrou'], ['froufrou']],
        },
      ]);
    });
  });

  describe('dereference "domain" step', () => {
    it('should dereferenced "reference" step into a pipeline', () => {
      expect(dereferencePipelines(pipelines['domain_p'], pipelines, sources)).toStrictEqual([
        { name: 'domain', domain: pipelines['lala'] },
      ]);
    });

    it('should dereferenced "domain" step into a source', () => {
      expect(dereferencePipelines(pipelines['domain_s'], pipelines, sources)).toStrictEqual([
        { name: 'domain', domain: [{ name: 'source', source: 'mika' }] },
      ]);
    });
  });
});
