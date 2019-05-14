<template>
  <div :class="{ 'popover': true, 'popover--active': isActive }" :style="elementStyle">
    <slot></slot>
  </div>
</template>
<script lang="ts">
import _ from 'lodash';
import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { POPOVER_ALIGN, POPOVER_SHADOW_GAP } from '@/lib/popover';

/**
 * We use weak typing as it is used to define CSS rules
 * And that we're not forced to define all four properties
 */
interface ElementPosition {
  top?: string | number;
  bottom?: string | number;
  left?: string | number;
  right?: string | number;
}

/**
@type {VueComponent}
@name Popover

@description
Implement a popover component

@params {Boolean} [active = false] toggles visibility
@params {String} [align = 'center'] sets the popover's default alignment:
                                    - possible values work like the text-align
                                      CSS property
                                    - justify adapts the popover to its parent
                                      (same width and horizontal position)
@params {Boolean} [bottom = false] sets the default position to below instead of
                                   above
*/
@Component({
  name: 'popover',
})
export default class Popover extends Vue {
  // To specify TypeScript that we got a HTMLElement
  $el!: HTMLElement;

  @Prop({
    type: Boolean,
    default: () => false,
  })
  active!: boolean;

  @Prop({
    default: () => POPOVER_ALIGN.CENTER,
    validator: value => _.includes(POPOVER_ALIGN, value),
  })
  align!: string;

  @Prop({
    type: Boolean,
    default: () => false,
  })
  bottom!: boolean;

  elementStyle: ElementPosition = {};
  parent: HTMLElement | null = null;
  parents: Array<HTMLElement> = [];

  get alignMethod() {
    switch (this.align) {
      case POPOVER_ALIGN.CENTER:
        return this.alignCenter;
      case POPOVER_ALIGN.JUSTIFY:
        return this.alignJustify;
      case POPOVER_ALIGN.LEFT:
        return this.alignLeft;
      case POPOVER_ALIGN.RIGHT:
        return this.alignRight;
      default:
        return () => ({});
    }
  }

  get isActive() {
    return this.active;
  }

  get isBottom() {
    return this.bottom;
  }

  mounted() {
    // Save original parent before moving into body to use its position
    this.parent = this.$el.parentElement;

    // Move the popover into the body to prevent its hiding by an
    // `overflow: hidden` container
    document.body.appendChild(this.$el);

    // Get all scrollable parents
    const parents = [];
    let { parent } = this;

    while (parent !== document.body && !_.isNull(parent)) {
      parents.push(parent);
      parent = parent.parentElement;
    }

    this.parents = parents;

    // Attach listeners
    window.addEventListener('orientationchange', this.orientationchangeListener);
    window.addEventListener('resize', this.resizeListener);
    _.forEach(this.parents, parent => {
      return parent.addEventListener('scroll', this.scrollListener);
    });

    this.updatePosition();
  }

  alignCenter(bodyBounds: DOMRect | ClientRect, parentBounds: DOMRect | ClientRect) {
    const parentLeft = parentBounds.left - bodyBounds.left;
    const parentRight = parentLeft + parentBounds.width;

    // Align center
    let left = parentLeft + (parentBounds.width - this.$el.offsetWidth) / 2;

    // Overflows on left
    if (left < 0) {
      // Align left
      left = parentLeft;
      // Overflows on right
    } else if (left + this.$el.offsetWidth > window.innerWidth) {
      // Align right
      left = parentRight - this.$el.offsetWidth;
    }

    return {
      left: `${left}px`,
    };
  }

  alignJustify(bodyBounds: DOMRect | ClientRect, parentBounds: DOMRect | ClientRect) {
    const parentLeft = parentBounds.left - bodyBounds.left;
    const parentRight = parentLeft + parentBounds.width;

    return {
      // Align left
      left: `${parentLeft}px`,
      // Use parent width
      width: `${parentBounds.width}px`,
    };
  }

  alignLeft(bodyBounds: DOMRect | ClientRect, parentBounds: DOMRect | ClientRect) {
    const parentLeft = parentBounds.left - bodyBounds.left;
    const parentRight = parentLeft + parentBounds.width;

    // Align left
    let left = parentLeft;

    if (
      // Overflows on right
      left + this.$el.offsetWidth > window.innerWidth &&
      // If aligned right, will not overflow on left
      parentRight - this.$el.offsetWidth >= 0
    ) {
      // Align right
      left = parentRight - this.$el.offsetWidth;
    }

    return {
      left: `${left}px`,
    };
  }

  alignRight(bodyBounds: DOMRect | ClientRect, parentBounds: DOMRect | ClientRect) {
    const parentLeft = parentBounds.left - bodyBounds.left;
    const parentRight = parentLeft + parentBounds.width;

    // Align right
    let left = parentRight - this.$el.offsetWidth;

    if (
      // Overflows on left
      left < 0 &&
      // If aligned left, will not overflow on right
      parentLeft + this.$el.offsetWidth <= window.innerWidth
    ) {
      // Align left
      left = parentLeft;
    }

    return {
      left: `${left}px`,
    };
  }

  // Update position on orientation change
  orientationchangeListener() {
    return this.updatePosition();
  }

  // Update position on resize
  resizeListener() {
    return this.updatePosition();
  }

  // Update position on scroll
  scrollListener() {
    return this.updatePosition();
  }

  // Set the absolute position
  // Checks available space on screen for vertical positioning and alignment
  updatePosition() {
    _.throttle(
      () => {
        let top;
        if (!this.isActive || this.parent === null) {
          return;
        }

        const bodyBounds = document.body.getBoundingClientRect();
        const parentBounds = this.parent.getBoundingClientRect();
        console.log('bodyBounds =>', bodyBounds);
        console.log('parentBounds =>', parentBounds);

        // Set alignment
        const elementStyle: ElementPosition = this.alignMethod(bodyBounds, parentBounds);

        const parentTop = parentBounds.top - bodyBounds.top;
        const topAbove = parentTop - POPOVER_SHADOW_GAP - this.$el.offsetHeight;
        const topBelow = parentTop + parentBounds.height;

        // Position above or below
        if (this.isBottom) {
          top = topBelow;

          // Not enough space below and enough space above
          if (topBelow + this.$el.offsetHeight > window.innerHeight && topAbove >= 0) {
            top = topAbove;
          }
        } else {
          top = topAbove;

          // Not enough space above and enough space below
          if (topAbove < 0 && topBelow + this.$el.offsetHeight <= window.innerHeight) {
            top = topBelow;
          }
        }

        elementStyle.top = `${top}px`;

        this.elementStyle = elementStyle;
        console.log('called');
      },
      // 60fps
      16,
    )();
  }

  @Watch('isActive')
  onisActiveChange(isActive: boolean) {
    if (isActive) {
      return this.updatePosition();
    }
  }

  beforeDestroy() {
    // Cleanup listeners
    window.removeEventListener('orientationchange', this.orientationchangeListener);
    window.removeEventListener('resize', this.resizeListener);
    _.forEach(this.parents, parent => {
      return parent.removeEventListener('scroll', this.scrollListener);
    });
    // Cleanup DOM
    if (!_.isNull(this.$el.parentElement)) {
      return this.$el.parentElement.removeChild(this.$el);
    }
  }
}
</script>
<style lang="scss" scoped>
.popover {
  position: absolute;
  visibility: hidden;
}

.popover--active {
  visibility: visible;
}
</style>
