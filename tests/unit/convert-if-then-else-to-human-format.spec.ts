import convertIfThenElseToHumanFormat, {
  EMPTY_CONDITION_SIGN,
} from '@/components/convert-if-then-else-to-human-format';

describe('convertIfThenElseToHumanFormat', function() {
  it('should handle a simple condition', function() {
    expect(
      convertIfThenElseToHumanFormat({
        if: { column: 'column', value: 'value', operator: 'eq' },
        then: 'then',
        else: 'else',
      }),
    ).toEqual(`column is 'value' <strong>THEN</strong> 'then' <strong>ELSE</strong> 'else'`);
  });
  it('should handle full empty condition', function() {
    expect(
      convertIfThenElseToHumanFormat({
        if: { operator: 'eq', column: '', value: '' },
        then: '',
        else: '',
      }),
    ).toEqual(
      `${EMPTY_CONDITION_SIGN} <strong>THEN</strong> ${EMPTY_CONDITION_SIGN} <strong>ELSE</strong> ${EMPTY_CONDITION_SIGN}`,
    );
  });
  it('should replace empty step with empty condition sign', function() {
    expect(
      convertIfThenElseToHumanFormat({
        if: { column: '', value: '', operator: 'eq' },
        then: '',
        else: '',
      }),
    ).toContain(EMPTY_CONDITION_SIGN);
  });
  it('should replace condition with empty column and value by empty condition sign', function() {
    expect(
      convertIfThenElseToHumanFormat({
        if: { column: '', value: '', operator: 'eq' },
        then: 'tata',
        else: 'toto',
      }),
    ).toContain(EMPTY_CONDITION_SIGN);
  });
  it('should delete else step on else if mode', function() {
    expect(
      convertIfThenElseToHumanFormat({
        if: { column: '', value: '', operator: 'eq' },
        then: '',
        else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: '' },
      }),
    ).not.toContain('ELSE');
  });
  it('should keep else step on else mode', function() {
    expect(
      convertIfThenElseToHumanFormat({
        if: { column: '', value: '', operator: 'eq' },
        then: '',
        else: '',
      }),
    ).toContain('ELSE');
  });
  it('should never display if/elseif separator', function() {
    const sentence = convertIfThenElseToHumanFormat({
      if: { column: '', value: '', operator: 'eq' },
      then: '',
      else: '',
    });
    expect(sentence).not.toContain(`IF`);
    expect(sentence).not.toContain(`ELSE IF`);
  });
  it('should always display then separator', function() {
    expect(
      convertIfThenElseToHumanFormat({
        if: { column: '', value: '', operator: 'eq' },
        then: '',
        else: '',
      }),
    ).toContain('THEN');
  });
  it('should handle a condition with multiple column values', function() {
    expect(
      convertIfThenElseToHumanFormat({
        if: { column: 'mycolumn', value: ['one', 'two'], operator: 'in' },
        then: '',
        else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: '' },
      }),
    ).toEqual(`mycolumn is in ('one', 'two') <strong>THEN</strong> ${EMPTY_CONDITION_SIGN}`);
  });

  it('should handle a condition with multiple columns and values', function() {
    expect(
      convertIfThenElseToHumanFormat({
        if: {
          or: [
            { operator: 'in', column: 'mycolumn1', value: ['one', 'two'] },
            { operator: 'eq', column: 'mycolumn2', value: 'and three' },
          ],
        },
        then: '',
        else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: '' },
      }),
    ).toEqual(
      `mycolumn1 is in ('one', 'two') <strong>OR</strong> mycolumn2 is 'and three' <strong>THEN</strong> ${EMPTY_CONDITION_SIGN}`,
    );
  });

  it('should handle deeply nested conditions', function() {
    expect(
      convertIfThenElseToHumanFormat({
        if: {
          and: [
            { operator: 'in', column: 'mycolumn1', value: ['one', 'two'] },
            { operator: 'eq', column: 'mycolumn2', value: 'three' },
            {
              or: [
                { operator: 'matches', column: 'mycolumn3', value: 'yo.*lo?' },
                { operator: 'notnull', column: 'mycolumn4', value: null },
              ],
            },
          ],
        },
        then: '',
        else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: '' },
      }),
    ).toEqual(
      `mycolumn1 is in ('one', 'two') <strong>AND</strong> mycolumn2 is 'three' <strong>AND</strong> (mycolumn3 matches 'yo.*lo?' <strong>OR</strong> mycolumn4 is not null) <strong>THEN</strong> ${EMPTY_CONDITION_SIGN}`,
    );
  });

  it('should handle a condition with a fallback for unhandled operators', function() {
    expect(
      convertIfThenElseToHumanFormat({
        if: { operator: 'matches', column: 'note', value: 'duh' },
        then: '',
        else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: '' },
      }),
    ).toEqual(`note matches 'duh' <strong>THEN</strong> ${EMPTY_CONDITION_SIGN}`);
  });

  it('should handle non-string values', function() {
    const firstOf2019 = new Date('2019-01-01');
    expect(
      convertIfThenElseToHumanFormat({
        if: {
          operator: 'in',
          column: 'myColumn',
          value: [1001, new Date('2019-01-01'), null],
        },
        then: '',
        else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: '' },
      }),
    ).toEqual(
      `myColumn is in (1001, ${firstOf2019.toString()}, null) <strong>THEN</strong> ${EMPTY_CONDITION_SIGN}`,
    );
  });

  it('should handle string values', function() {
    expect(
      convertIfThenElseToHumanFormat({
        if: { operator: 'in', column: 'myColumn', value: '{{ user.groups }}' },
        then: '',
        else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: '' },
      }),
    ).toEqual(
      `myColumn is in (<em>user.groups</em>) <strong>THEN</strong> ${EMPTY_CONDITION_SIGN}`,
    );
  });

  it('should display interpolated values with some emphasis', function() {
    expect(
      convertIfThenElseToHumanFormat({
        if: { operator: 'eq', column: 'city', value: '{{ user.attributes.city }}' },
        then: '{{ user.attributes.city }}',
        else: { if: { column: '', value: '', operator: 'eq' }, then: '', else: '' },
      }),
    ).toEqual(
      'city is <em>user.attributes.city</em> <strong>THEN</strong> <em>user.attributes.city</em>',
    );
  });
});
