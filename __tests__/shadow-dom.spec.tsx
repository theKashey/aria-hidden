import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { suppressOthers } from '../src';

describe('shadow dom', () => {
  it('Understand the host location', () => {
    function App() {
      return (
        <div className="App">
          <input id="input" />
          <input id="another-input" />
        </div>
      );
    }

    const template = document.createElement('template');

    template.innerHTML = `
          <div>
            <p part="title">React attached below</p>
            <div id="root"></div>
          </div>
        `;

    class WebComp extends HTMLElement {
      root: ShadowRoot | undefined = undefined;
      getTarget() {
        return this.root!.querySelector<HTMLInputElement>('#input')!;
      }
      getAnotherTarget() {
        return this.root!.querySelector<HTMLInputElement>('#another-input')!;
      }
      constructor() {
        super();

        // attach to the Shadow DOM
        this.root = this.attachShadow({ mode: 'closed' });
        this.root.appendChild(template.content.cloneNode(true));

        ReactDOM.render(<App />, this.root);
      }
    }

    window.customElements.define('web-comp', WebComp);

    const webComp = document.createElement('web-comp') as WebComp;
    document.body.innerHTML = '<div id="test"></div>';
    document.body.appendChild(webComp);

    suppressOthers(webComp.getTarget());
    expect(webComp.getAttribute('aria-hidden')).toBeFalsy();

    expect(document.body.innerHTML).toMatchInlineSnapshot(
      `"<div id=\\"test\\" data-suppressed=\\"true\\" aria-hidden=\\"true\\"></div><web-comp></web-comp>"`
    );

    expect(webComp.root!.innerHTML).toMatchInlineSnapshot(
      `"<div class=\\"App\\"><input id=\\"input\\"><input id=\\"another-input\\"></div>"`
    );

    suppressOthers(webComp.getTarget(), webComp.root as any);
    expect(webComp.getTarget().getAttribute('aria-hidden')).toBeFalsy();
    expect(webComp.getAnotherTarget().getAttribute('aria-hidden')).not.toBeFalsy();

    document.body.innerHTML = '';

    // assert error
    const error = jest.spyOn(console, 'error');
    suppressOthers(webComp.getTarget());

    expect(error).toHaveBeenCalledWith(
      'aria-hidden',
      webComp.getTarget(),
      expect.any(String),
      document.body,
      expect.any(String)
    );
  });
});
