import { isValidUrl, urlHost } from './printItems';

describe('isValidUrl', () => {
  it.each([
    'https://www.printables.com/model/1',
    'http://a.co',
    '  https://a.co  ',
    'HTTPS://A.CO/x?y=1#z',
  ])('accepts %p', (value) => {
    expect(isValidUrl(value)).toBe(true);
  });

  it.each([
    'printables.com',
    'javascript:alert(1)',
    'ftp://a.co',
    'https://',
    'https:///path',
    'https://a b.co',
    'https://a.co/a b',
    '',
  ])('rejects %p', (value) => {
    expect(isValidUrl(value)).toBe(false);
  });
});

describe('urlHost', () => {
  it('drops the scheme, www, path, query and hash', () => {
    expect(urlHost('https://www.printables.com/model/1?x=1')).toBe('printables.com');
    expect(urlHost('https://a.co#top')).toBe('a.co');
  });

  it('keeps the port and drops user info', () => {
    expect(urlHost('http://localhost:8080/a')).toBe('localhost:8080');
    expect(urlHost('http://user:pw@a.co/x')).toBe('a.co');
  });
});
