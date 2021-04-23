import * as React from 'react';
import {mount} from 'enzyme';
import {hideOthers} from "../src";

describe('Specs', () => {
  const factory = () => {
    const parent = React.createRef<any>();
    const target1 = React.createRef<any>();
    const target2 = React.createRef<any>();
    const targetOutside1 = React.createRef<any>();
    const wrapper = mount(
      <div>
        <div ref={parent}>
          <div>hide me 1</div>
          <div ref={target1}>not me 2</div>
          <div>
            <div ref={target2}>not me 3</div>
          </div>
          <div ref={targetOutside1}>hide me 4</div>
          <svg>
            <text>svg</text>
          </svg>
          <div aria-hidden>I am already hidden! 5</div>
        </div>
        <div>dont touch me 6</div>
      </div>
    );
    const base = wrapper.html();

    return {
      base, wrapper,
      parent, target1, target2, targetOutside1,
    }
  };

  const getNearestAttribute = (node, name, parent) => {
    const attr = node.getAttribute(name);
    if (attr) {
      return attr;
    }
    if (node === parent || !node.parentNode) {
      return null;
    }
    return getNearestAttribute(node.parentNode, name, parent)
  }

  it('hides single', () => {
    const {
      base, parent, target1, target2, targetOutside1, wrapper
    } = factory();

    const unhide = hideOthers(target1.current, parent.current);
    expect(wrapper.update().html()).toMatchSnapshot();

    expect(getNearestAttribute(target1.current, 'aria-hidden', parent)).toBe(null);
    expect(getNearestAttribute(target2.current, 'aria-hidden', parent)).toBe("true");
    expect(getNearestAttribute(targetOutside1.current, 'aria-hidden', parent)).toBe("true");

    unhide();
    expect(wrapper.html()).toEqual(base);
  });

  it('hides multiple', () => {
    const {
      base, parent, target1, target2, targetOutside1, wrapper
    } = factory();

    const unhide = hideOthers([target1.current, target2.current], parent.current);
    expect(wrapper.html()).toMatchSnapshot();

    expect(getNearestAttribute(target1.current, 'aria-hidden', parent)).toBe(null);
    expect(getNearestAttribute(target2.current, 'aria-hidden', parent)).toBe(null);
    expect(getNearestAttribute(targetOutside1.current, 'aria-hidden', parent)).toBe("true");

    unhide();
    expect(wrapper.html()).toEqual(base);
  });

  it('hides cross', () => {
    const {
      base, parent, target1, target2, targetOutside1, wrapper
    } = factory();

    const unhide1 = hideOthers(target1.current, parent.current);
    expect(wrapper.html()).toMatchSnapshot();

    expect(getNearestAttribute(target1.current, 'aria-hidden', parent)).toBe(null);
    expect(getNearestAttribute(target2.current, 'aria-hidden', parent)).toBe("true");
    expect(getNearestAttribute(targetOutside1.current, 'aria-hidden', parent)).toBe("true");
    expect(getNearestAttribute(targetOutside1.current, 'data-aria-hidden', parent)).toBe("true");

    const unhide2 = hideOthers(target2.current, parent.current);

    expect(getNearestAttribute(target1.current, 'aria-hidden', parent)).toBe("true");
    expect(getNearestAttribute(target2.current, 'aria-hidden', parent)).toBe("true");
    expect(getNearestAttribute(targetOutside1.current, 'aria-hidden', parent)).toBe("true");
    expect(getNearestAttribute(targetOutside1.current, 'data-aria-hidden', parent)).toBe("true");

    expect(wrapper.html()).toMatchSnapshot();
    unhide1();

    expect(getNearestAttribute(target1.current, 'aria-hidden', parent)).toBe("true");
    expect(getNearestAttribute(target2.current, 'aria-hidden', parent)).toBe(null);
    expect(getNearestAttribute(targetOutside1.current, 'aria-hidden', parent)).toBe("true");
    expect(getNearestAttribute(targetOutside1.current, 'data-aria-hidden', parent)).toBe("true");

    expect(wrapper.html()).toMatchSnapshot();
    unhide2();

    expect(wrapper.html()).toEqual(base)
  });

  it('hides cross markers', () => {
    const {
      base, parent, target1, target2, targetOutside1, wrapper
    } = factory();

    const unhide1 = hideOthers(target1.current, parent.current, 'marker1');
    expect(getNearestAttribute(targetOutside1.current, 'marker1', parent)).toBe("true");

    const unhide2 = hideOthers(target2.current, parent.current, 'marker2');

    expect(getNearestAttribute(targetOutside1.current, 'marker1', parent)).toBe("true");
    expect(getNearestAttribute(targetOutside1.current, 'marker2', parent)).toBe("true");

    unhide1();

    expect(getNearestAttribute(targetOutside1.current, 'marker1', parent)).toBe(null);

    expect(wrapper.html()).toMatchSnapshot();
    unhide2();

    expect(wrapper.html()).toEqual(base)
  });
  it('works on IE11', () => {
    // Simulate IE11 DOM Node implementation.
    HTMLElement.prototype.contains = Node.prototype.contains;
    delete Node.prototype.contains;
    const {
      base, parent, target1, target2, targetOutside1, wrapper
    } = factory();

    const unhide = hideOthers(target1.current, parent.current);
    expect(wrapper.update().html()).toMatchSnapshot();

    expect(getNearestAttribute(target1.current, 'aria-hidden', parent)).toBe(null);
    expect(getNearestAttribute(target2.current, 'aria-hidden', parent)).toBe("true");
    expect(getNearestAttribute(targetOutside1.current, 'aria-hidden', parent)).toBe("true");

    unhide();
    expect(wrapper.html()).toEqual(base);
  });
});
