<template>
  <div
    class="action-menu__option"
    :disabled="isDisabled"
    :class="{ 'action-menu__option--disabled': isDisabled }"
    data-cy="weaverbird-action-menu-option"
    @click="onActionClicked"
    v-tooltip="{
      targetClasses: 'has-weaverbird__tooltip',
      classes: 'weaverbird__tooltip',
      content: !isDisabled ? '' : 'This step is not available for this connector',
      placement: 'bottom-center',
    }"
  >
    {{ label }}
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  name: 'action-menu-option',
  
  props: {
    label: {
      type: String,
      required: true
    },
    isDisabled: {
      type: Boolean,
      default: false
    }
  },
  
  methods: {
    onActionClicked() {
      if (this.isDisabled) return;
      this.$emit('actionClicked');
    }
  }
});
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
