<template>
  <span
    class="weaverbird-popover"
    :class="{ 'weaverbird-popover--always-opened': alwaysOpened }"
    data-cy="weaverbird-popover"
    :style="elementStyle"
    @click.stop
  >
    <slot />
  </span>
</template>
<script lang="ts">
import _ from 'lodash';
import Vue from 'vue';
import { Component, Inject, Prop, Watch } from 'vue-property-decorator';

import { Alignment } from '@/components/constants';
import * as DOMUtil from '@/components/domutil';

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
@params {Boolean} visible sets the popover visibility. If `true` the popover is mounted.

@params {String} [align = 'center'] sets the popover's default alignment:
  - possible values work like the text-align CSS property
  - justify adapts the popover to its parent (same width and horizontal position)

@params {Boolean} [bottom = false] sets the default position to below instead of above

@params {Boolean} [alwaysOpened = false] always displays the popover, and keep its content in the page flow rather than
in an floating element. Useful to create previews of configurable popovers. Make the prop `visible` effect-less.
*/
@Component({
  name: 'popover',
})
export default class Popover extends Vue {
  // To specify TypeScript that we got a HTMLElement
  $el!: HTMLElement;

  @Prop({
    type: Boolean,
    required: true,
  })
  visible!: boolean;

  @Prop({
    default: () => Alignment.Center,
    validator: value => Object.values(Alignment).includes(value),
  })
  align!: Alignment;

  @Prop({
    type: Boolean,
    default: () => false,
  })
  bottom!: boolean;

  @Prop({
    type: Number,
    default: 0, // we increment the number each time we need the position to be updated
  })
  forcePositionUpdate!: number;

  @Prop({
    type: Boolean,
    default: false,
  })
  alwaysOpened!: boolean;

  // Inject any element as `weaverbirdPopoverContainer` in any parent component
  @Inject({ default: document.body }) weaverbirdPopoverContainer!: Element;

  elementStyle: ElementPosition = {};
  parent: HTMLElement | null = null;
  element: HTMLElement | null = null;
  parents: HTMLElement[] = [];
  updatePositionListener!: () => void;
  clickListener!: () => void;

  @Watch('visible')
  async onVisibleChange(visible: boolean) {
    if (this.alwaysOpened) {
      return;
    }

    if (!visible) {
      this.destroyPositioning();
    } else {
      this.setupPositioning();
    }
  }

  @Watch('forcePositionUpdate')
  forceUpdatePosition() {
    this.updatePosition();
  }

  async mounted() {
    if (this.alwaysOpened) {
      // Skip all the repositioning in the DOM
      return;
    }

    // Save original parent before moving into body to use its position
    this.parent = this.$el.parentElement;
    // Remove element from parent: it will be added to body when `setupPosition`
    if (this.parent !== null) {
      this.parent.removeChild(this.$el);
    } else {
      throw new Error('The popover has no parent!');
    }

    // Get all scrollable parents
    const parents = [];
    let { parent } = this;

    while (parent !== this.weaverbirdPopoverContainer) {
      parents.push(parent);
      if (parent.parentElement) {
        parent = parent.parentElement;
      } else {
        break;
      }
    }

    this.parents = parents;

    // instantiate the events listener
    this.updatePositionListener = () => this.updatePosition();
    this.clickListener = () => this.$emit('closed');
    // IMPORTANT: in order to not close the popover when clicking inside, any click
    // from inside the popover are not propagated to the window

    if (this.visible) {
      this.setupPositioning();
    }
  }

  beforeDestroy() {
    if (this.visible && !this.alwaysOpened) {
      this.destroyPositioning();
    }
  }

  setupPositioning() {
    this.weaverbirdPopoverContainer.appendChild(this.$el);
    this.updatePosition();
    // Attach listeners
    window.addEventListener('click', this.clickListener);
    window.addEventListener('orientationchange', this.updatePositionListener);
    window.addEventListener('resize', this.updatePositionListener);
    for (const parent of this.parents) {
      parent.addEventListener('scroll', this.updatePositionListener);
    }
  }

  destroyPositioning() {
    // Cleanup listeners
    window.removeEventListener('click', this.clickListener);
    window.removeEventListener('orientationchange', this.updatePositionListener);
    window.removeEventListener('resize', this.updatePositionListener);
    for (const parent of this.parents) {
      parent.removeEventListener('scroll', this.updatePositionListener);
    }
    // Cleanup DOM
    if (this.$el.parentElement !== null) {
      return this.$el.parentElement.removeChild(this.$el);
    }
  }

  // Set the absolute position
  // Checks available space on screen for vertical positioning and alignment
  updatePosition = _.throttle(
    function(this: Popover) {
      if (this.parent === null) {
        return;
      }

      const positionContext = {
        body: this.weaverbirdPopoverContainer.getBoundingClientRect(),
        parent: this.parent.getBoundingClientRect(),
        element: this.$el,
        window,
      };
      // Set alignment
      const elementStyle: ElementPosition = DOMUtil.align(this.align, positionContext);
      elementStyle.top = DOMUtil.computeTop(this.bottom, positionContext);
      // make sure to use `px` unit explicitly
      this.elementStyle = _.fromPairs(Object.entries(elementStyle).map(([k, v]) => [k, `${v}px`]));
    },
    // 60fps
    16,
  );
}
</script>
<style lang="scss" scoped>
.weaverbird-popover {
  font-family: 'Montserrat', sans-serif;
  position: absolute;
  visibility: visible;
  z-index: 2;
}
</style>
