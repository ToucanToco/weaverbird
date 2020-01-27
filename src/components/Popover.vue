<template>
  <div :class="{ popover: true, 'popover--active': isActive }" :style="elementStyle">
    <slot />
  </div>
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
    default: false,
  })
  active!: boolean;

  @Prop({
    default: () => Alignment.Center,
    validator: value => Object.values(Alignment).includes(value),
  })
  align!: string;

  @Prop({
    type: Boolean,
    default: () => false,
  })
  bottom!: boolean;

  elementStyle: ElementPosition = {};
  parent: HTMLElement | null = null;
  parents: HTMLElement[] = [];

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

    while (parent !== document.body && parent !== null) {
      parents.push(parent);
      parent = parent.parentElement;
    }

    this.parents = parents;

    // Attach listeners
    window.addEventListener('orientationchange', this.orientationchangeListener);
    window.addEventListener('resize', this.resizeListener);
    for (const p of parents) {
      p.addEventListener('scroll', this.scrollListener);
    }
    this.updatePosition();
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
  updatePosition = _.throttle(
    function() {
      if (!this.isActive || this.parent === null) {
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
      elementStyle.top = DOMUtil.computeTop(this.isBottom, positionContext);
      // make sure to use `px` unit explicitly
      this.elementStyle = _.fromPairs(Object.entries(elementStyle).map(([k, v]) => [k, `${v}px`]));
    },
    // 60fps
    16,
  );

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
    for (const parent of this.parents) {
      parent.removeEventListener('scroll', this.scrollListener);
    }
    // Cleanup DOM
    if (this.$el.parentElement !== null) {
      return this.$el.parentElement.removeChild(this.$el);
    }
  }
}
</script>
<style lang="scss" scoped>
.popover {
  font-family: 'Montserrat', sans-serif;
  position: absolute;
  visibility: hidden;
}

.popover--active {
  visibility: visible;
}
</style>
