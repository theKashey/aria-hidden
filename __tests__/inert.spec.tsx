import { render } from '@testing-library/react';
import * as React from 'react';

import { inertOthers, supportsInert } from '../src';
import { getNearestAttribute } from './utils';

describe('inert', () => {
  it('supports in jsdom', () => {
    // not yet
    expect(supportsInert()).toBeFalsy();
  });

  it('handles inert', () => {
    const wrapper = render(
      <div>
        <div>
          <div id="to-be-hidden">hidden</div>
        </div>
        <div id="not-to-be-hidden">not-hidden</div>
      </div>
    );
    const root = wrapper.baseElement.firstElementChild!;

    const unhide = inertOthers(root.firstElementChild!.lastElementChild!, root as any);

    expect(getNearestAttribute(root.querySelector('#to-be-hidden')!, 'inert', { current: root })).toBe('true');
    expect(getNearestAttribute(root.querySelector('#not-to-be-hidden')!, 'inert', { current: root })).toBe(null);

    expect(wrapper.baseElement.innerHTML).toMatchInlineSnapshot(
      `"<div><div><div data-inert-ed=\\"true\\" inert=\\"true\\"><div id=\\"to-be-hidden\\">hidden</div></div><div id=\\"not-to-be-hidden\\">not-hidden</div></div></div>"`
    );

    unhide();
  });
});
