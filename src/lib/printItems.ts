// A regex instead of `URL`: React Native's URL polyfill is incomplete.
const URL_PATTERN = /^https?:\/\/[^\s/?#]+([/?#]\S*)?$/i;

export function isValidUrl(value: string): boolean {
  return URL_PATTERN.test(value.trim());
}

export function urlHost(url: string): string {
  const authority = url
    .trim()
    .replace(/^https?:\/\//i, '')
    .split(/[/?#]/)[0];
  return authority.slice(authority.lastIndexOf('@') + 1).replace(/^www\./i, '');
}
