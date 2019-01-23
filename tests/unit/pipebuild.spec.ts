import { mongoToPipe } from '@/pipebuild';

describe('Pipebuild translator', () => {
  it('generate basic pipeline steps from mongo steps', () => {
    const pipeline = mongoToPipe([{ $match: { name: 'bla' } }])
    expect(pipeline.length).toBe(1);
    expect(pipeline).toEqual([
      { $match: { name: 'bla' }, translated: true }
    ])
  })
})
