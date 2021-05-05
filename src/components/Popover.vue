<template>
  <span class="popover" data-cy="weaverbird-popover" :style="elementStyle" @click.stop>
    <slot />
  </span>
</template>
<script lang="ts">
import _ from 'lodash';
import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';

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

  elementStyle: ElementPosition = {};
  parent: HTMLElement | null = null;
  element: HTMLElement | null = null;
  parents: HTMLElement[] = [];
  updatePositionListener!: () => void;
  clickListener!: () => void;

  @Watch('visible')
  async onVisibleChange(visible: boolean) {
    if (!visible) {
      this.destroyPositioning();
    } else {
      this.setupPositioning();
    }
  }

  async mounted() {
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

    while (parent !== document.body) {
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
    if (this.visible) {
      this.destroyPositioning();
    }
  }

  setupPositioning() {
    // Move the popover into the body to prevent its hiding by an
    // `overflow: hidden` container
    document.body.appendChild(this.$el);
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
        body: document.body.getBoundingClientRect(),
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
.popover {
  font-family: 'Montserrat', sans-serif;
  position: absolute;
  visibility: visible;
  z-index: 2;
}
</style>
