import { createId } from './ids';

describe('createId', () => {
  it('starts with the given prefix', () => {
    expect(createId('house')).toMatch(/^house-\d+-\d+$/);
  });
});
