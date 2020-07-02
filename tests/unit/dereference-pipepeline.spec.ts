import { dereferencePipelines, PipelinesScopeContext } from '@/store/state';

const pipelines: PipelinesScopeContext = {
  lala: [
    { name: 'domain', domain: 'jjg' },
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
    { name: 'domain', domain: 'jjg' },
    {
      name: 'append',
      pipelines: ['lala'],
    },
  ],
  append_s: [
    { name: 'domain', domain: 'jjg' },
    {
      name: 'append',
      pipelines: ['jjg'],
    },
  ],
  join_p: [
    { name: 'domain', domain: 'mika' },
    {
      name: 'join',
      right_pipeline: 'lala',
      type: 'left',
      on: [['froufrou'], ['froufrou']],
    },
  ],
  join_s: [
    { name: 'domain', domain: 'mika' },
    {
      name: 'join',
      right_pipeline: 'jjg',
      type: 'left',
      on: [['froufrou'], ['froufrou']],
    },
  ],
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
        { name: 'domain', domain: 'jjg' },
        {
          name: 'append',
          pipelines: [pipelines['lala']],
        },
      ]);
    });

    it('should dereferenced "append" step into a source', () => {
      expect(dereferencePipelines(pipelines['append_s'], pipelines, sources)).toStrictEqual([
        { name: 'domain', domain: 'jjg' },
        {
          name: 'append',
          pipelines: [[{ name: 'domain', domain: 'jjg' }]],
        },
      ]);
    });
  });

  describe('dereference "join" step', () => {
    it('should dereferenced "join" step into a pipeline', () => {
      expect(dereferencePipelines(pipelines['join_p'], pipelines, sources)).toStrictEqual([
        { name: 'domain', domain: 'mika' },
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
        { name: 'domain', domain: 'mika' },
        {
          name: 'join',
          right_pipeline: [{ name: 'domain', domain: 'jjg' }],
          type: 'left',
          on: [['froufrou'], ['froufrou']],
        },
      ]);
    });
  });
});
