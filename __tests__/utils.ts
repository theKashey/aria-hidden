import { RefObject } from 'react';

export const getNearestAttribute = (node: Element, name: string, parent: RefObject<Element> | Element): any => {
  const attr = node.getAttribute(name);

  if (attr) {
    return attr;
  }

  // @ts-ignore
  if (node === parent || node === parent.current || !node.parentNode) {
    return null;
  }

  return getNearestAttribute(node.parentNode as any, name, parent);
};
