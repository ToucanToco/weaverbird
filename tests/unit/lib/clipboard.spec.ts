import {
  CLIPBOARD_PARSER,
  copyToClipboard,
  parseTextForClipboard,
  parseTextFromClipboard,
  pasteFromClipboard,
} from '@/lib/clipboard';

const TEXT = 'TOTO';
const TEXT_WITH_PARSERS = `${CLIPBOARD_PARSER}TOTO${CLIPBOARD_PARSER}`;

const writeTextStub = jest.fn(),
  readTextStub = jest.fn();

Object.assign(navigator, {
  clipboard: {
    writeText: writeTextStub,
    readText: readTextStub,
  },
});

describe('parseTextFromClipboard', () => {
  it('should return string without parsers', () => {
    const value = parseTextFromClipboard(`PARSERTOTOPARSER`, 'PARSER');
    expect(value).toStrictEqual('TOTO');
  });
  it('should return empty string if passed value is undefined', () => {
    const value = parseTextFromClipboard(undefined, 'PARSER');
    expect(value).toStrictEqual('');
  });
  it('should return empty string if string was already empty', () => {
    const value = parseTextFromClipboard('', 'PARSER');
    expect(value).toStrictEqual('');
  });
  it('should return empty string if passed value has no parsers', () => {
    const value = parseTextFromClipboard(`OTHERTOTOOTHER`, 'PARSER');
    expect(value).toStrictEqual('');
  });
});
describe('parseTextForClipboard', () => {
  it('should return string with parsers', () => {
    const value = parseTextForClipboard('TOTO', 'PARSER');
    expect(value).toStrictEqual(`PARSERTOTOPARSER`);
  });
  it('should return empty string if string was already empty', () => {
    const value = parseTextForClipboard('', 'PARSER');
    expect(value).toStrictEqual('');
  });
});

describe('copyToClipboard', () => {
  it('should copy updated string with parsers to clipboard', async () => {
    await copyToClipboard(TEXT);
    expect(writeTextStub).toHaveBeenCalledWith(TEXT_WITH_PARSERS);
  });
});

describe('pasteFromClipboard', () => {
  beforeEach(async () => {
    readTextStub.mockResolvedValue(TEXT_WITH_PARSERS);
  });
  it('should return retrieved data without parsers', async () => {
    const value = await pasteFromClipboard();
    expect(readTextStub).toHaveBeenCalled();
    expect(value).toStrictEqual(TEXT);
  });
  describe('when paste value is not coming from weaverbird', () => {
    beforeEach(async () => {
      readTextStub.mockResolvedValue('IamBAD');
    });
    it('should return an empty string', async () => {
      const value = await pasteFromClipboard();
      expect(value).toStrictEqual('');
    });
  });
});
