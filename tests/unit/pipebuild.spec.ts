import { MongoStep, mongoToPipe } from '@/pipebuild';

describe('Pipebuild translator', () => {
    it('generate domain step', () => {
        const query: Array<MongoStep> = [{ $match: { domain: 'test_cube' } }];
        const pipeline = mongoToPipe(query);
        expect(pipeline).toEqual([{ step: 'Domain', query: { $match: { domain: 'test_cube' } } }]);
    });

    it('generate domain and filter steps from one match', () => {
        const query: Array<MongoStep> = [
            { $match: { domain: 'test_cube', Region: 'Europe', Manager: 'Pierre' } },
        ];
        const pipeline = mongoToPipe(query);
        expect(pipeline).toEqual([
            { step: 'Domain', query: { $match: { domain: 'test_cube' } } },
            { step: 'Filter', query: { $match: { Region: 'Europe', Manager: 'Pierre' } } },
        ]);
    });

    it('generate domain and filter steps', () => {
        const query: Array<MongoStep> = [
            { $match: { domain: 'test_cube' } },
            { $match: { Region: 'Europe' } },
        ];
        const pipeline = mongoToPipe(query);
        expect(pipeline).toEqual([
            { step: 'Domain', query: { $match: { domain: 'test_cube' } } },
            { step: 'Filter', query: { $match: { Region: 'Europe' } } },
        ]);
    });

    it('generate domain step and filter several columns step', () => {
        const query: Array<MongoStep> = [
            { $match: { domain: 'test_cube' } },
            { $match: { Region: 'Europe', Manager: 'Pierre' } },
        ];
        const pipeline = mongoToPipe(query);
        expect(pipeline).toEqual([
            { step: 'Domain', query: { $match: { domain: 'test_cube' } } },
            { step: 'Filter', query: { $match: { Region: 'Europe', Manager: 'Pierre' } } },
        ]);
    });
});
