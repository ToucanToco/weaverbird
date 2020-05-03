<template>
  <popover :visible="visible" :align="alignLeft" bottom @closed="$emit('closed')">
    <div class="menu__body">
      <transition name="slide-left" mode="out-in">
        <div v-if="visiblePanel == 1">
          <div class="menu__panel">
            <div
              v-for="button in buttons"
              :key="button.label"
              class="menu__option"
              @click="button.onclick"
              v-html="button.html"
            />
            <div
              v-if="otherButtons.length > 0"
              class="menu__option menu__option--top-bordered"
              @click="visiblePanel = 2"
            >
              Other Operations
            </div>
            <div class="menu__option--top-bordered">
              <slot name="first-panel-special" />
            </div>
          </div>
        </div>
      </transition>
      <transition name="slide-right" mode="out-in">
        <div v-if="visiblePanel == 2">
          <div class="menu__panel">
            <div class="menu__option--back" @click="visiblePanel = 1">
              <i class="fas fa-angle-left" /> BACK
            </div>
            <div
              class="menu__option"
              v-for="button in otherButtons"
              :key="button.label"
              @click="button.onclick"
              v-html="button.html"
            />
            <div class="menu__option--top-bordered">
              <slot name="second-panel-special" />
            </div>
          </div>
        </div>
      </transition>
    </div>
  </popover>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import { POPOVER_ALIGN } from '@/components/constants';

import Popover from './Popover.vue';

enum VisiblePanel {
  'MAIN OPERATIONS',
  'OTHER OPERATIONS',
}

export type ButtonsList = { html: string; onclick: Function }[];

@Component({
  name: 'menu-popover',
  components: {
    Popover,
  },
})
export default class Menu extends Vue {
  @Prop({
    type: Boolean,
    required: true,
  })
  visible!: boolean;

  @Prop({
    type: Array,
    required: true,
  })
  buttons!: ButtonsList;

  @Prop({
    type: Array,
    default: () => [],
  })
  otherButtons!: ButtonsList;

  visiblePanel: VisiblePanel = 1;
  alignLeft = POPOVER_ALIGN.LEFT;
}
</script>
<style lang="scss" scoped>
@import '../styles/_variables';

.menu__body {
  display: flex;
  border-radius: 10px;
  //   margin-left: -5px;
  //   margin-right: -5px;
  width: 200px;
  background-color: #fff;
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.25);
  color: $base-color;
  overflow: hidden;
}

.menu__panel {
  display: flex;
  width: 200px;
  flex-direction: column;
  border-color: $data-viewer-border-color;

  &:not(:last-child) {
    border-bottom-style: solid;
    border-bottom-width: 1px;
  }
}

.menu__option {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 13px;
  padding: 10px 12px;
  line-height: 20px;
  position: relative;

  &:hover {
    background-color: rgba(0, 0, 0, 0.03);
    color: $active-color;
  }

  &:last-child {
    margin-bottom: 0;
  }
}
.menu__option--top-bordered {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.menu__option--back {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 13px;
  padding: 10px 12px;
  line-height: 20px;
  position: relative;
  font-weight: 600;

  &:last-child {
    margin-bottom: 0;
  }
}

.fa-angle-left {
  margin-right: 5px;
}

.slide-left-enter,
.slide-right-leave {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter,
.slide-left-leave {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}
</style>
