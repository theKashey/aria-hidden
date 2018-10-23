export type Undo = () => void;

const defaultParent = typeof document !== 'undefined' ? document.body : null;

export const hideOthers = (target: HTMLElement, parentNode = defaultParent): Undo => {
  const originalValues = new Map();

  const deep = (parent: HTMLElement | null) => {
    if (!parent || parent === target) {
      return;
    }
    Array.prototype.forEach.call(parent.children, (node: HTMLElement) => {
      if (node.contains(target)) {
        deep(node);
      } else {
        const attr = node.getAttribute('aria-hidden');
        const alreadyHidden = attr !== null && attr !== 'false';
        if (alreadyHidden) {
          return
        }
        originalValues.set(node, attr);
        node.setAttribute('aria-hidden', 'true')
      }
    })
  };

  deep(parentNode);

  return () => {
    originalValues.forEach((hiddenAttr, node) => {
      if (hiddenAttr === null) {
        node.removeAttribute('aria-hidden')
      } else {
        node.setAttribute('aria-hidden', hiddenAttr)
      }
    })
  }
};