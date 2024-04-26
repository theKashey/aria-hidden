export type Undo = () => void;

const getDefaultParent = (originalTarget: Element | Element[]): HTMLElement | null => {
  if (typeof document === 'undefined') {
    return null;
  }

  const sampleTarget = Array.isArray(originalTarget) ? originalTarget[0] : originalTarget;

  return sampleTarget.ownerDocument.body;
};

let counterMap: WeakMap<Element, number> = new WeakMap<Element, number>();
let uncontrolledNodes: WeakMap<Element, boolean> = new WeakMap<Element, boolean>();
let markerMap: Record<string, WeakMap<Element, number>> = {};
let lockCount = 0;

const unwrapHost = (node: Element | ShadowRoot): Element | null =>
  node && ((node as ShadowRoot).host || unwrapHost(node.parentNode as Element));

const correctTargets = (parent: HTMLElement, targets: Element[]): Element[] =>
  targets
    .map((target) => {
      if (parent.contains(target)) {
        return target;
      }

      const correctedTarget = unwrapHost(target);

      if (correctedTarget && parent.contains(correctedTarget)) {
        return correctedTarget;
      }

      console.error('aria-hidden', target, 'in not contained inside', parent, '. Doing nothing');

      return null;
    })
    .filter((x): x is Element => Boolean(x));

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
  const targets = correctTargets(parentNode, Array.isArray(originalTarget) ? originalTarget : [originalTarget]);

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
        try {
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
        } catch (e) {
          console.error('aria-hidden: cannot operate on ', node, e);
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
  parentNode?: HTMLElement,
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
  parentNode?: HTMLElement,
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
  parentNode?: HTMLElement,
  markerName = 'data-suppressed'
): Undo => (supportsInert() ? inertOthers : hideOthers)(originalTarget, parentNode, markerName);
