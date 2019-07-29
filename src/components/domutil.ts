/**
 * This module contains DOM / browser utility functions, e.g. positioning
 * helpers used by the Popover.
 */
import { Alignment, POPOVER_SHADOW_GAP } from '@/components/constants';

/**
 * `WindowDimensions` represents the subpart of the `Window` object that is needed
 * to compute various dimension and alignment properties in our helpers.
 */
type WindowDimensions = Pick<Window, 'innerWidth' | 'innerHeight'>;

/**
 * `ElementOffset` represents the subpart of an `HTMLElement` object that is needed
 * to compute various dimension and alignment properties in our helpers.
 */
type ElementOffset = Pick<HTMLElement, 'offsetWidth' | 'offsetHeight'>;

/**
 * `PositionContext` is a type that provides all positioning context for a given element
 * that can be required to compute a specific new positioning
 */
type PositionContext = {
  /** the main element being manipulated */
  element: ElementOffset;
  /** its parent element's position */
  parent: ClientRect;
  /** the document body's position */
  body: ClientRect;
  /** the window dimensions */
  window: WindowDimensions;
};

type PartialPositionContext = Partial<
{ [K in keyof PositionContext]: Partial<PositionContext[K]> }
>;

/**
 * convert a client rect to a plain javascript object.
 *
 * NOTE: Spread syntax can't be used since `ClientRect` objects have no
 * enumerable properties.
 * NOTE2: a hack might to be use `rect.toJSON()` but it's unclear whether or
 * not it would be supported on "all" browsers.
 *
 * @param rect the input client rect
 */
function _toPlainObj(rect: Partial<ClientRect>) {
  return {
    width: rect.width || 0,
    height: rect.height || 0,
    top: rect.top || 0,
    left: rect.left || 0,
    bottom: rect.bottom || 0,
    right: rect.right || 0,
  };
}

/**
 * Builds a `ClientRect` object from a partial definition passed in parameter and
 * defaulting each unspecified property to `0`.
 *
 * @param customRect the custom rect properties to define.
 */
function completeClientRect(customRect: Partial<ClientRect> = {}): ClientRect {
  const defaultRect = {
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  };
  return { ...defaultRect, ..._toPlainObj(customRect) };
}

/**
 * Builds an `ElementOffset` object from a partial definition passed in parameter and
 * defaulting each unspecified property to `0`.
 *
 * @param customOffset the custom element offset properties to define.
 */
function completeOffset(customOffset: Partial<ElementOffset> = {}): ElementOffset {
  const defaultOffset = {
    offsetWidth: 0,
    offsetHeight: 0,
  };
  return { ...defaultOffset, ...customOffset };
}

/**
 * Builds a `WindowDimensions` object from a partial definition passed in parameter and
 * defaulting each unspecified property to `0`.
 *
 * @param customDimensions the custom window dimensions properties to define.
 */
function innerDimensions(customDimensions: Partial<WindowDimensions>): WindowDimensions {
  const defaultDimensions = {
    innerWidth: 0,
    innerHeight: 0,
  };
  return { ...defaultDimensions, ...customDimensions };
}

/**
 * Builds a `PositionContext` object from a partial definition passed in parameter and
 * defaulting each unspecified property (**recursively**) to `0`. Each subproperty is
 * optional.
 *
 * @param customDimensions the custom window dimensions properties to define.
 */
function completePositionContext(context: PartialPositionContext): PositionContext {
  return {
    body: completeClientRect(context.body),
    parent: completeClientRect(context.parent),
    element: completeOffset(context.element),
    window: innerDimensions(context.window as WindowDimensions),
  };
}

/**
 * Compute the position properties required to center-align `ctx.element`.
 *
 * @param ctx the position context used to make positioning computations
 */
function alignCenter(ctx: PartialPositionContext) {
  const { body, parent, element, window } = completePositionContext(ctx);
  const parentLeft = parent.left - body.left;
  const parentRight = parentLeft + parent.width;

  // Align center
  let left = parentLeft + (parent.width - element.offsetWidth) / 2;

  // Overflows on left
  if (left < 0) {
    // Align left
    left = parentLeft;
    // Overflows on right
  } else if (left + element.offsetWidth > window.innerWidth) {
    // Align right
    left = parentRight - element.offsetWidth;
  }

  return { left };
}

/**
 * Compute the position properties required to justify-align `ctx.element`.
 *
 * @param ctx the position context used to make positioning computations
 */
function alignJustify(ctx: PartialPositionContext) {
  const { body, parent } = completePositionContext(ctx);
  const parentLeft = parent.left - body.left;

  // Align left and use parent width
  return { left: parentLeft, width: parent.width };
}

/**
 * Compute the position properties required to left-align `ctx.element`.
 *
 * @param ctx the position context used to make positioning computations
 */
function alignLeft(ctx: PartialPositionContext) {
  const { body, parent, element, window } = completePositionContext(ctx);
  const parentLeft = parent.left - body.left;
  const parentRight = parentLeft + parent.width;
  // Align left
  let left = parentLeft;

  if (
    // Overflows on right
    left + element.offsetWidth > window.innerWidth &&
    // If aligned right, will not overflow on left
    parentRight - element.offsetWidth >= 0
  ) {
    // Align right
    left = parentRight - element.offsetWidth;
  }

  return { left };
}

/**
 * Compute the position properties required to right-align `ctx.element`.
 *
 * @param ctx the position context used to make positioning computations
 */
function alignRight(ctx: PartialPositionContext) {
  const { body, parent, element, window } = completePositionContext(ctx);
  const parentLeft = parent.left - body.left;
  const parentRight = parentLeft + parent.width;

  // Align right
  let left = parentRight - element.offsetWidth;

  if (
    // Overflows on left
    left < 0 &&
    // If aligned left, will not overflow on right
    parentLeft + element.offsetWidth <= window.innerWidth
  ) {
    // Align left
    left = parentLeft;
  }
  return { left };
}

/**
 * Compute the position properties required to justify-align `ctx.element`.
 *
 * @param alignment the alignment strategy (e.g `Alignment.Center`, `Alignment.Justify`)
 * @param ctx the position context used to make positioning computations
 */
export function align(alignment: Alignment, ctx: PartialPositionContext) {
  switch (alignment) {
    case Alignment.Center:
      return alignCenter(ctx);
    case Alignment.Justify:
      return alignJustify(ctx);
    case Alignment.Left:
      return alignLeft(ctx);
    case Alignment.Right:
      return alignRight(ctx);
  }
}

/**
 * Compute the "top" position propertiy required for `ctx.element`.
 *
 * @param fromBottom whether or not the element should be "bottom" or "top" aligned
 * @param ctx the position context used to make positioning computations
 */
export function computeTop(fromBottom = false, ctx: PartialPositionContext) {
  let top;
  const { body, parent, element, window } = completePositionContext(ctx);
  const parentTop = parent.top - body.top;
  const topAbove = parentTop - POPOVER_SHADOW_GAP - element.offsetHeight;
  const topBelow = parentTop + parent.height;

  // Position above or below
  if (fromBottom) {
    top = topBelow;

    // Not enough space below and enough space above
    if (topBelow + element.offsetHeight > window.innerHeight && topAbove >= 0) {
      top = topAbove;
    }
  } else {
    top = topAbove;

    // Not enough space above and enough space below
    if (topAbove < 0 && topBelow + element.offsetHeight <= window.innerHeight) {
      top = topBelow;
    }
  }

  return top;
}
