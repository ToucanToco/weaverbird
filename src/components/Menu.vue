<template>
  <popover :visible="visible" :align="alignLeft" bottom @closed="$emit('closed')">
    <div class="menu__body">
      <slot name="body">
        <MenuPanel>
          <slot />
        </MenuPanel>
      </slot>
    </div>
  </popover>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import { POPOVER_ALIGN } from '@/components/constants';

import MenuPanel from './Menu/MenuPanel.vue';
import Popover from './Popover.vue';
/**
 * A popover menu, with content can be customized via a slot.
 *
 * The whole body can be changed using the slot "menu-body" instead of the default one.
 */
@Component({
  name: 'menu-popover',
  components: {
    MenuPanel,
    Popover,
  },
})
export default class Menu extends Vue {
  @Prop({
    type: Boolean,
    required: true,
  })
  visible!: boolean;

  alignLeft = POPOVER_ALIGN.LEFT;
}
</script>

<style lang="scss" scoped>
@import '../styles/_variables';

.menu__body {
  display: flex;
  border-radius: 10px;
  width: 200px;
  background-color: #fff;
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.25);
  color: $base-color;
  overflow: hidden;
}
</style>
