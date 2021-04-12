import { extractVariableIdentifier } from '@/lib/variables';

describe('extractVariableIdentifier', () => {
  it('should extract simple variable names', () => {
    expect(
      extractVariableIdentifier('{{ hummus }}', {
        start: '{{',
        end: '}}',
      }),
    ).toBe('hummus');
  });

  it('should extract malformatted variable', () => {
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
