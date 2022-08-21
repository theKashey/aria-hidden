export type Undo = () => void;

const getDefaultParent = (originalTarget: Element | Element[]): HTMLElement | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const sampleTarget = Array.isArray(originalTarget) ? originalTarget[0] : originalTarget;

  return sampleTarget.ownerDocument.body;
};

let counterMap = new WeakMap<Element, number>();
let uncontrolledNodes = new WeakMap<Element, boolean>();
let markerMap: Record<string, WeakMap<Element, number>> = {};
let lockCount = 0;

/**
 * Marks everything except given node(or nodes) as aria-hidden
 * @param {Element | Element[]} originalTarget - elements to keep on the page
 * @param [parentNode] - top element, defaults to document.body
 * @param {String} [markerName] - a special attribute to mark every node
 * @param {String} [controlAttribute] - html Attribute to control
 * @return {Undo} undo command
 */
const applyAttributeToOthers = (
  originalTarget: Element | Element[],
  parentNode: HTMLElement,
  markerName: string,
  controlAttribute: string
): Undo => {
  const targets = Array.isArray(originalTarget) ? originalTarget : [originalTarget];

  if (!markerMap[markerName]) {
    markerMap[markerName] = new WeakMap();
  }

  const markerCounter = markerMap[markerName];
  const hiddenNodes: Element[] = [];

  const elementsToKeep = new Set<Node>();
  const elementsToStop = new Set<Node>(targets);

  const keep = (el: Node | undefined) => {
    if (!el || elementsToKeep.has(el)) {
      return;
    }

    elementsToKeep.add(el);
    keep(el.parentNode!);
  };

  targets.forEach(keep);

  const deep = (parent: Element | null) => {
    if (!parent || elementsToStop.has(parent)) {
      return;
    }

    Array.prototype.forEach.call(parent.children, (node: Element) => {
      if (elementsToKeep.has(node)) {
        deep(node);
      } else {
        const attr = node.getAttribute(controlAttribute);
        const alreadyHidden = attr !== null && attr !== 'false';
        const counterValue = (counterMap.get(node) || 0) + 1;
        const markerValue = (markerCounter.get(node) || 0) + 1;

        counterMap.set(node, counterValue);
        markerCounter.set(node, markerValue);
        hiddenNodes.push(node);

        if (counterValue === 1 && alreadyHidden) {
          uncontrolledNodes.set(node, true);
        }

        if (markerValue === 1) {
          node.setAttribute(markerName, 'true');
        }

        if (!alreadyHidden) {
          node.setAttribute(controlAttribute, 'true');
        }
      }
    });
  };

  deep(parentNode);
  elementsToKeep.clear();

  lockCount++;

  return () => {
    hiddenNodes.forEach((node) => {
      const counterValue = counterMap.get(node)! - 1;
      const markerValue = markerCounter.get(node)! - 1;

      counterMap.set(node, counterValue);
      markerCounter.set(node, markerValue);

      if (!counterValue) {
        if (!uncontrolledNodes.has(node)) {
          node.removeAttribute(controlAttribute);
        }

        uncontrolledNodes.delete(node);
      }

      if (!markerValue) {
        node.removeAttribute(markerName);
      }
    });

    lockCount--;

    if (!lockCount) {
      // clear
      counterMap = new WeakMap();
      counterMap = new WeakMap();
      uncontrolledNodes = new WeakMap();
      markerMap = {};
    }
  };
};

/**
 * Marks everything except given node(or nodes) as aria-hidden
 * @param {Element | Element[]} originalTarget - elements to keep on the page
 * @param [parentNode] - top element, defaults to document.body
 * @param {String} [markerName] - a special attribute to mark every node
 * @return {Undo} undo command
 */
export const hideOthers = (
  originalTarget: Element | Element[],
  parentNode: HTMLElement | undefined,
  markerName = 'data-aria-hidden'
): Undo => {
  const targets = Array.from(Array.isArray(originalTarget) ? originalTarget : [originalTarget]);
  const activeParentNode = parentNode || getDefaultParent(originalTarget);

  if (!activeParentNode) {
    return () => null;
  }

  // we should not hide ariaLive elements - https://github.com/theKashey/aria-hidden/issues/10
  targets.push(...Array.from(activeParentNode.querySelectorAll('[aria-live]')));

  return applyAttributeToOthers(targets, activeParentNode, markerName, 'aria-hidden');
};

/**
 * Marks everything except given node(or nodes) as inert
 * @param {Element | Element[]} originalTarget - elements to keep on the page
 * @param [parentNode] - top element, defaults to document.body
 * @param {String} [markerName] - a special attribute to mark every node
 * @return {Undo} undo command
 */
export const inertOthers = (
  originalTarget: Element | Element[],
  parentNode: HTMLElement | undefined,
  markerName = 'data-inert-ed'
): Undo => {
  const activeParentNode = parentNode || getDefaultParent(originalTarget);

  if (!activeParentNode) {
    return () => null;
  }

  return applyAttributeToOthers(originalTarget, activeParentNode, markerName, 'inert');
};

/**
 * @returns if current browser supports inert
 */
export const supportsInert = (): boolean =>
  typeof HTMLElement !== 'undefined' && HTMLElement.prototype.hasOwnProperty('inert');

/**
 * Automatic function to "suppress" DOM elements - _hide_ or _inert_ in the best possible way
 * @param {Element | Element[]} originalTarget - elements to keep on the page
 * @param [parentNode] - top element, defaults to document.body
 * @param {String} [markerName] - a special attribute to mark every node
 * @return {Undo} undo command
 */
export const suppressOthers = (
  originalTarget: Element | Element[],
  parentNode: HTMLElement | undefined,
  markerName = 'data-suppressed'
): Undo => (supportsInert() ? inertOthers : hideOthers)(originalTarget, parentNode, markerName);
