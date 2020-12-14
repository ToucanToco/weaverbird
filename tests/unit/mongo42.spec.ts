import { getTranslator } from '@/lib/translators';

describe('Mongo 4.2 translator', () => {
  const mongo42translator = getTranslator('mongo42');

  it('should support any kind of operation', () => {
    expect(mongo42translator.unsupportedSteps).toEqual([]);
  });

  it('should support regexes in conditions', () => {
    expect(
      mongo42translator.translate([
        {
          name: 'ifthenelse',
          newColumn: 'NEW_COL',
          if: { column: 'TEST_COL', operator: 'matches', value: '^a' },
          then: '"True"',
          else: '"False"',
        },
      ]),
    ).toStrictEqual([
      {
        $addFields: {
          NEW_COL: {
            $cond: {
              else: 'False',
              if: { $regexMatch: ['$TEST_COL', '^a'] },
              then: 'True',
            },
          },
        },
      },
      { $project: { _id: 0 } },
    ]);

    expect(
      mongo42translator.translate([
        {
          name: 'ifthenelse',
          newColumn: 'NEW_COL',
          if: { column: 'TEST_COL', operator: 'notmatches', value: '^a' },
          then: '"True"',
          else: '"False"',
        },
      ]),
    ).toStrictEqual([
      {
        $addFields: {
          NEW_COL: {
            $cond: {
              else: 'False',
              if: { $not: { $regexMatch: ['$TEST_COL', '^a'] } },
              then: 'True',
            },
          },
        },
      },
      { $project: { _id: 0 } },
    ]);
  });
});
