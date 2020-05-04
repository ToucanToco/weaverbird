<template>
  <div class="menu__panel">
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({
  name: 'menu-panel',
})
export default class MenuPanel extends Vue {}
</script>

<style lang="scss" scoped>
@import '../../styles/_variables';

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
</style>
