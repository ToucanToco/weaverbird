<template>
  <div
    class="action-menu__option"
    :disabled="isDisabled"
    :class="{ 'action-menu__option--disabled': isDisabled }"
    data-cy="weaverbird-action-menu-option"
    @click="onActionClicked"
  >
    {{ label }}
  </div>
</template>
  
<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

@Component({
  name: 'action-menu-option',
})
export default class ActionMenuOption extends Vue {
  @Prop({})
  label!: string;

  @Prop({})
  isDisabled!: boolean;

  onActionClicked() {
    if (this.isDisabled) return; // TODO
    this.$emit('actionClicked');
  }
}
</script>
<style lang="scss">
@import '../styles/_variables';

.action-menu__option {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 13px;
  padding: 10px 12px;
  line-height: 20px;
  justify-content: space-between;
  position: relative;

  &:hover {
    background-color: rgba(0, 0, 0, 0.03);
    color: $active-color;
  }
}

.action-menu__option--disabled {
  &,
  &:hover {
    cursor: not-allowed;
    color: $grey-medium;
  }
}
</style>
  