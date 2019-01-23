import { MongoStep, mongoToPipe } from '@/pipebuild';

describe('Pipebuild translator', () => {
    it('generate match steps', () => {
        const query: Array<MongoStep> = [{ $match: { domain: 'test_cube' } }];
        const pipeline = mongoToPipe(query);
        expect(pipeline).toEqual([{ step: 'Domain', query: { $match: { domain: 'test_cube' } } }]);
    });
});
