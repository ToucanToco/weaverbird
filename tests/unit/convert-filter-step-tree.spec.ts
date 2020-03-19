import {
  buildConditionsEditorTree,
  buildFilterStepTree,
  castFilterStepTreeValue,
  isFilterCombo,
} from '@/components/stepforms/convert-filter-step-tree.ts';

describe('Convert filter step tree', () => {
  describe('isFilterCombo', () => {
    it('should return true when the passed object is a group', () => {
      expect(isFilterCombo({ or: [{ column: 'columnC', operator: 'eq', value: 'true' }] })).toEqual(
        true,
      );
    });

    it('should return false when the passed object is a condition', () => {
      expect(isFilterCombo({ column: 'columnA', operator: 'eq', value: 'true' })).toEqual(false);
    });

    it('should return false when the passed object is not defined', () => {
      expect(isFilterCombo(undefined)).toEqual(false);
    });
  });

  describe('buildConditionsEditorTree', () => {
    it('should return a simple condition', () => {
      expect(
        buildConditionsEditorTree({ column: 'columnA', operator: 'eq', value: 'true' }),
      ).toEqual({
        operator: '',
        conditions: [{ column: 'columnA', operator: 'eq', value: 'true' }],
        groups: [],
      });
    });

    it('should return a condition with operator', () => {
      expect(
        buildConditionsEditorTree({
          and: [
            { column: 'columnA', operator: 'eq', value: 'true' },
            { column: 'columnB', operator: 'eq', value: 'true' },
          ],
        }),
      ).toEqual({
        operator: 'and',
        conditions: [
          { column: 'columnA', operator: 'eq', value: 'true' },
          { column: 'columnB', operator: 'eq', value: 'true' },
        ],
        groups: [],
      });
    });

    it('should return a condition with groups', () => {
      expect(
        buildConditionsEditorTree({
          and: [
            { column: 'columnA', operator: 'eq', value: 'true' },
            { column: 'columnB', operator: 'eq', value: 'true' },
            { or: [{ column: 'columnC', operator: 'eq', value: 'true' }] },
          ],
        }),
      ).toEqual({
        operator: 'and',
        conditions: [
          { column: 'columnA', operator: 'eq', value: 'true' },
          { column: 'columnB', operator: 'eq', value: 'true' },
        ],
        groups: [
          {
            operator: 'or',
            conditions: [{ column: 'columnC', operator: 'eq', value: 'true' }],
            groups: [],
          },
        ],
      });
    });

    it('should return a condition with depth groups', () => {
      expect(
        buildConditionsEditorTree({
          and: [
            { column: 'columnA', operator: 'eq', value: 'true' },
            { column: 'columnB', operator: 'eq', value: 'true' },
            {
              or: [
                { column: 'columnC', operator: 'eq', value: 'true' },
                { column: 'columnD', operator: 'eq', value: 'true' },
                { or: [{ column: 'columnE', operator: 'eq', value: 'true' }] },
              ],
            },
          ],
        }),
      ).toEqual({
        operator: 'and',
        conditions: [
          { column: 'columnA', operator: 'eq', value: 'true' },
          { column: 'columnB', operator: 'eq', value: 'true' },
        ],
        groups: [
          {
            operator: 'or',
            conditions: [
              { column: 'columnC', operator: 'eq', value: 'true' },
              { column: 'columnD', operator: 'eq', value: 'true' },
            ],
            groups: [
              {
                operator: 'or',
                conditions: [{ column: 'columnE', operator: 'eq', value: 'true' }],
                groups: [],
              },
            ],
          },
        ],
      });
    });
  });

  describe('buildFilterStepTree', () => {
    it('should return a simple condition', () => {
      expect(
        buildFilterStepTree(
          {
            operator: '',
            conditions: [{ column: 'columnA', operator: 'eq', value: 'true' }],
            groups: [],
          },
          true,
        ),
      ).toEqual({
        name: 'filter',
        condition: { column: 'columnA', operator: 'eq', value: 'true' },
      });
    });

    it('should return a condition with operator', () => {
      expect(
        buildFilterStepTree(
          {
            operator: 'and',
            conditions: [
              { column: 'columnA', operator: 'eq', value: 'true' },
              { column: 'columnB', operator: 'eq', value: 'true' },
            ],
            groups: [],
          },
          true,
        ),
      ).toEqual({
        name: 'filter',
        condition: {
          and: [
            { column: 'columnA', operator: 'eq', value: 'true' },
            { column: 'columnB', operator: 'eq', value: 'true' },
          ],
        },
      });
    });

    it('should return a condition with groups', () => {
      expect(
        buildFilterStepTree(
          {
            operator: 'and',
            conditions: [
              { column: 'columnA', operator: 'eq', value: 'true' },
              { column: 'columnB', operator: 'eq', value: 'true' },
            ],
            groups: [
              {
                operator: 'or',
                conditions: [
                  { column: 'columnC', operator: 'eq', value: 'true' },
                  { column: 'columnD', operator: 'eq', value: 'true' },
                ],
                groups: [],
              },
            ],
          },
          true,
        ),
      ).toEqual({
        name: 'filter',
        condition: {
          and: [
            { column: 'columnA', operator: 'eq', value: 'true' },
            { column: 'columnB', operator: 'eq', value: 'true' },
            {
              or: [
                { column: 'columnC', operator: 'eq', value: 'true' },
                { column: 'columnD', operator: 'eq', value: 'true' },
              ],
            },
          ],
        },
      });
    });

    it('should return a condition with depth groups', () => {
      expect(
        buildFilterStepTree(
          {
            operator: 'and',
            conditions: [
              { column: 'columnA', operator: 'eq', value: 'true' },
              { column: 'columnB', operator: 'eq', value: 'true' },
            ],
            groups: [
              {
                operator: 'or',
                conditions: [
                  { column: 'columnC', operator: 'eq', value: 'true' },
                  { column: 'columnD', operator: 'eq', value: 'true' },
                ],
                groups: [
                  {
                    operator: 'and',
                    conditions: [
                      { column: 'columnE', operator: 'eq', value: 'true' },
                      { column: 'columnF', operator: 'eq', value: 'true' },
                    ],
                    groups: [],
                  },
                ],
              },
            ],
          },
          true,
        ),
      ).toEqual({
        name: 'filter',
        condition: {
          and: [
            { column: 'columnA', operator: 'eq', value: 'true' },
            { column: 'columnB', operator: 'eq', value: 'true' },
            {
              or: [
                { column: 'columnC', operator: 'eq', value: 'true' },
                { column: 'columnD', operator: 'eq', value: 'true' },
                {
                  and: [
                    { column: 'columnE', operator: 'eq', value: 'true' },
                    { column: 'columnF', operator: 'eq', value: 'true' },
                  ],
                },
              ],
            },
          ],
        },
      });
    });
  });

  describe('castFilterStepTreeValue', () => {
    it('should cast filterStepTreeValue according to columnTypes', () => {
      expect(
        castFilterStepTreeValue(
          {
            and: [
              { column: 'toto', value: '1', operator: 'eq' },
              { column: 'tata', value: 'true', operator: 'eq' },
            ],
          },
          {
            toto: 'integer',
            tutu: 'float',
            tata: 'boolean',
            titi: 'string',
          },
        ),
      ).toEqual({
        and: [
          { column: 'toto', value: 1, operator: 'eq' },
          { column: 'tata', value: true, operator: 'eq' },
        ],
      });
    });
    it('should cast filterStepTreeValue according to columnTypes', () => {
      expect(
        castFilterStepTreeValue(
          {
            and: [
              { column: 'toto', value: '1', operator: 'eq' },
              { column: 'tata', value: 'true', operator: 'eq' },
              {
                or: [
                  { column: 'titi', value: 'B', operator: 'ne' },
                  { column: 'tutu', value: '2.1', operator: 'le' },
                ],
              },
            ],
          },
          {
            toto: 'integer',
            tutu: 'float',
            tata: 'boolean',
            titi: 'string',
          },
        ),
      ).toEqual({
        and: [
          { column: 'toto', value: 1, operator: 'eq' },
          { column: 'tata', value: true, operator: 'eq' },
          {
            or: [
              { column: 'titi', value: 'B', operator: 'ne' },
              { column: 'tutu', value: 2.1, operator: 'le' },
            ],
          },
        ],
      });
    });
    it('should cast filterStepTreeValue according to columnTypes', () => {
      expect(
        castFilterStepTreeValue(
          {
            and: [
              { column: 'toto', value: '1', operator: 'eq' },
              { column: 'tata', value: 'true', operator: 'eq' },
              {
                or: [
                  { column: 'titi', value: 'B', operator: 'ne' },
                  { column: 'tutu', value: '2.1', operator: 'le' },
                  {
                    or: [
                      { column: 'titi', value: 'B', operator: 'ne' },
                      { column: 'tutu', value: '2.1', operator: 'le' },
                    ],
                  },
                ],
              },
              {
                and: [
                  { column: 'titi', value: 'B', operator: 'ne' },
                  { column: 'tutu', value: '2.1', operator: 'le' },
                ],
              },
            ],
          },
          {
            toto: 'integer',
            tutu: 'float',
            tata: 'boolean',
            titi: 'string',
          },
        ),
      ).toEqual({
        and: [
          { column: 'toto', value: 1, operator: 'eq' },
          { column: 'tata', value: true, operator: 'eq' },
          {
            or: [
              { column: 'titi', value: 'B', operator: 'ne' },
              { column: 'tutu', value: 2.1, operator: 'le' },
              {
                or: [
                  { column: 'titi', value: 'B', operator: 'ne' },
                  { column: 'tutu', value: 2.1, operator: 'le' },
                ],
              },
            ],
          },
          {
            and: [
              { column: 'titi', value: 'B', operator: 'ne' },
              { column: 'tutu', value: 2.1, operator: 'le' },
            ],
          },
        ],
      });
    });
    it('should cast filterStepTreeValue according to columnTypes', () => {
      expect(
        castFilterStepTreeValue(
          {
            and: [
              { column: 'toto', value: '1', operator: 'eq' },
              { column: 'tata', value: ['true', 'false'], operator: 'in' },
              {
                or: [
                  { column: 'titi', value: 'B', operator: 'ne' },
                  { column: 'tutu', value: '2.1', operator: 'le' },
                  {
                    or: [
                      { column: 'titi', value: 'B', operator: 'ne' },
                      { column: 'tutu', value: ['2.1', '2.3'], operator: 'in' },
                    ],
                  },
                ],
              },
              {
                and: [
                  { column: 'titi', value: 'B', operator: 'ne' },
                  { column: 'tutu', value: '2.1', operator: 'le' },
                ],
              },
            ],
          },
          {
            toto: 'integer',
            tutu: 'float',
            tata: 'boolean',
            titi: 'string',
          },
        ),
      ).toEqual({
        and: [
          { column: 'toto', value: 1, operator: 'eq' },
          { column: 'tata', value: [true, false], operator: 'in' },
          {
            or: [
              { column: 'titi', value: 'B', operator: 'ne' },
              { column: 'tutu', value: 2.1, operator: 'le' },
              {
                or: [
                  { column: 'titi', value: 'B', operator: 'ne' },
                  { column: 'tutu', value: [2.1, 2.3], operator: 'in' },
                ],
              },
            ],
          },
          {
            and: [
              { column: 'titi', value: 'B', operator: 'ne' },
              { column: 'tutu', value: 2.1, operator: 'le' },
            ],
          },
        ],
      });
    });
  });
});
