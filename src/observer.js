import { parseRootMargin, shallowCompareOptions } from './utils';

export const observerElementsMap = new Map();

export function getPooled(options = {}) {
    const root = options.root || null;
    const rootMargin = parseRootMargin(options.rootMargin);
    const threshold = Array.isArray(options.threshold)
        ? options.threshold
        : [typeof options.threshold !== 'undefined' ? options.threshold : 0];
    const observers = observerElementsMap.keys();
    let observer;
    while ((observer = observers.next().value)) {
        const unmatched = [
            [root, observer.root],
            [rootMargin, observer.rootMargin],
            [threshold, observer.thresholds],
        ].some(option => shallowCompareOptions(...option));

        if (!unmatched) {
            return observer;
        }
    }
    return null;
}

export function findObserverElement(entry, observer) {
    const elements = observerElementsMap.get(observer);
    if (elements) {
        const values = elements.values();
        let element;
        while ((element = values.next().value)) {
            if (element.target === entry.target) {
                return element;
            }
        }
    }
    return null;
}

export function createObserver(callback, options) {
    return getPooled(options) || new IntersectionObserver(callback, options);
}

export function observeElement(element) {
    let targets;
    if (observerElementsMap.has(element.observer)) {
        targets = observerElementsMap.get(element.observer);
    } else {
        targets = new Set();
        observerElementsMap.set(element.observer, targets);
    }
    targets.add(element);
    element.observer.observe(element.target);
}

export function unobserveElement(element) {
    if (observerElementsMap.has(element.observer)) {
        const targets = observerElementsMap.get(element.observer);
        if (targets.delete(element)) {
            if (targets.size > 0) {
                element.observer.unobserve(element.target);
            } else {
                element.observer.disconnect();
                observerElementsMap.delete(element.observer);
            }
        }
    }
}