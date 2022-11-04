import { extractVariableIdentifier, retrieveVariable } from '@/lib/variables';

describe('extractVariableIdentifier', () => {
  it('should extract simple variable names', () => {
    expect(
      extractVariableIdentifier('{{ hummus }}', {
        start: '{{',
        end: '}}',
      }),
    ).toBe('hummus');
  });

  it('should extract the right variable identifier despite leading or trailing whitespace or their absence', () => {
    expect(
      extractVariableIdentifier('{{ malformatted}}', {
        start: '{{',
        end: '}}',
      }),
    ).toBe('malformatted');
    expect(
      extractVariableIdentifier('{{malformatted }}', {
        start: '{{',
        end: '}}',
      }),
    ).toBe('malformatted');
    expect(
      extractVariableIdentifier('{{malformatted}}', {
        start: '{{',
        end: '}}',
      }),
    ).toBe('malformatted');
  });

  it('should extract variable names with dots', () => {
    expect(
      extractVariableIdentifier('{{ hummus.mtabal }}', {
        start: '{{',
        end: '}}',
      }),
    ).toBe('hummus.mtabal');
  });

  it('should extract variable names with other property access methods', () => {
    expect(
      extractVariableIdentifier("{{ hummus['mtabal'] }}", {
        start: '{{',
        end: '}}',
      }),
    ).toBe("hummus['mtabal']");
  });

  it('should extract variable names with any number of leading and trailing whitespaces', () => {
    expect(
      extractVariableIdentifier('     {{ hummus         }}  ', {
        start: '{{',
        end: '}}',
      }),
    ).toBe('hummus');
  });

  it('should extract expressions', () => {
    expect(
      extractVariableIdentifier('{{ a + b }}  ', {
        start: '{{',
        end: '}}',
      }),
    ).toBe('a + b');
  });

  it('should extract variables with different delimiters', () => {
    expect(
      extractVariableIdentifier('<%= croissant %>', {
        start: '<%=',
        end: '%>',
      }),
    ).toBe('croissant');
  });
});

describe('retrieveVariable', () => {
  const availableVariables = [{ identifier: 'date', value: '', label: 'Date' }];
  const variableDelimiters = { start: '<%=', end: '%>' };
  it("should return undefined if variable don't exist in available variables", () => {
    expect(
      retrieveVariable('<%= croissant %>', availableVariables, variableDelimiters),
    ).toBeUndefined();
  });
  it('should return undefined if variable delimiters are not attended one', () => {
    expect(retrieveVariable('{{ date }}', availableVariables, variableDelimiters)).toBeUndefined();
  });
  it('should return variable if variable exist in available variables', () => {
    expect(retrieveVariable('<%= date %>', availableVariables, variableDelimiters)).toStrictEqual(
      availableVariables[0],
    );
  });
});
