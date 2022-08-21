/**
 * @jest-environment node
 */

import { supportsInert } from '../src';

describe('smoke ssr', () => {
  it('do not throw', () => {
    expect(supportsInert()).toBeFalsy();
  });
});
