<template>
  <div class="menu__option">
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({
  name: 'menu-option',
})
export default class MenuOption extends Vue {}
</script>

<style lang="scss" scoped>
@import '../../styles/_variables';

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
</style>
