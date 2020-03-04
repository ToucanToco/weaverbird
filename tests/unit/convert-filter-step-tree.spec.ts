import {
  buildConditionsEditorTree,
  buildFilterStepTree,
  isFilterStepGroup,
} from '@/components/stepforms/convert-filter-step-tree.ts';

describe('Convert filter step tree', () => {
  describe('isFilterStepGroup', () => {
    it('should return true when the passed object is a group', () => {
      expect(
        isFilterStepGroup({ or: [{ column: 'columnC', operator: 'eq', value: 'true' }] }),
      ).toEqual(true);
    });

    it('should return true when the passed object is a condition', () => {
      expect(isFilterStepGroup({ column: 'columnA', operator: 'eq', value: 'true' })).toEqual(
        false,
      );
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

    it('should return a condition with operator', () => {
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
                    operator: 'blu',
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
                  blu: [
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
});
