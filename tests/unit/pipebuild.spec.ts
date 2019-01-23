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

    it('generate domain and rename steps', () => {
        const query: Array<MongoStep> = [
            { $match: { domain: 'test_cube' } },
            { $project: { zone: '$Region' } },
        ];
        const pipeline = mongoToPipe(query);
        expect(pipeline).toEqual([
            { step: 'Domain', query: { $match: { domain: 'test_cube' } } },
            { step: 'Rename column', query: { $project: { zone: '$Region' } } },
        ]);
    });

    it('generate domain and delete steps', () => {
        const query: Array<MongoStep> = [
            { $match: { domain: 'test_cube' } },
            { $project: { Manager: 0 } },
        ];
        const pipeline = mongoToPipe(query);
        expect(pipeline).toEqual([
            { step: 'Domain', query: { $match: { domain: 'test_cube' } } },
            { step: 'Delete column', query: { $project: { Manager: 0 } } },
        ]);
    });

    it('generate domain and custom steps from project :1', () => {
        const query: Array<MongoStep> = [
            { $match: { domain: 'test_cube' } },
            { $project: { Manager: 1 } },
        ];
        const pipeline = mongoToPipe(query);
        expect(pipeline).toEqual([
            { step: 'Domain', query: { $match: { domain: 'test_cube' } } },
            { step: 'Custom step', query: { $project: { Manager: 1 } } },
        ]);
    });

    // it('generate domain and custom steps from heterogeneous project', () => {
    //     const query: Array<MongoStep> = [
    //         { $match: { domain: 'test_cube' } },
    //         { $project: { zone: '$Region', Manager: 0 } },
    //     ];
    //     const pipeline = mongoToPipe(query);
    //     expect(pipeline).toEqual([
    //         { step: 'Domain', query: { $match: { domain: 'test_cube' } } },
    //         { step: 'Custom step', query: { $project: { zone: '$Region',
    //         Manager: 0 } } },
    //     ]);
    // });

    // it('generate domain and custom steps from unknown operator', () => {
    //     const query: Array<MongoStep> = [
    //         { $match: { domain: 'test_cube' } },
    //         { $group: { _id: '$Manager', Value: { $sum: '$Value' } } },
    //     ];
    //     const pipeline = mongoToPipe(query);
    //     expect(pipeline).toEqual([
    //         { step: 'Domain', query: { $match: { domain: 'test_cube' } } },
    //         {
    //             step: 'Custom step',
    //             query: { $group: { _id: '$Manager', Value: { $sum: '$Value' } }
    //             },
    //         },
    //     ]);
    // });
});
