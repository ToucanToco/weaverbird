<template>
  <div
    class="widget-variable-option"
    :class="{ 'widget-variable-option--selected': selected }"
    :key="identifier"
    v-tooltip="{
      targetClasses: 'has-weaverbird__tooltip',
      classes: 'weaverbird__tooltip',
      content: readableValue,
      placement: 'bottom-center',
    }"
    @click="$emit('input', identifier)"
  >
    <div class="widget-variable-option__container">
      <span v-if="togglable" class="widget-variable-option__toggle" />
      <span class="widget-variable-option__name">{{ label }}</span>
    </div>
    <span class="widget-variable-option__value">{{ formattedValue }}</span>
  </div>
</template>

<script lang="ts">
import VTooltip from 'v-tooltip';
import { Component, Prop, Vue } from 'vue-property-decorator';

Vue.use(VTooltip);
/**
 * This component display a variable option in list
 */
@Component({
  name: 'variable-list-option',
})
export default class VariableListOption extends Vue {
  @Prop({ default: () => '' })
  selectedVariables!: string | string[];

  @Prop({ default: () => undefined })
  value!: any;

  @Prop({ default: () => '' })
  label!: string;

  @Prop({ default: () => '' })
  identifier!: string;

  @Prop({ default: () => false })
  togglable!: boolean;

  get formattedValue(): string {
    return this.value instanceof Date ? this.value.toUTCString() : this.value;
  }

  get readableValue(): string {
    return JSON.stringify(this.formattedValue);
  }

  get selected(): boolean {
    if (Array.isArray(this.selectedVariables)) {
      return this.selectedVariables.indexOf(this.identifier) != -1;
    } else {
      return this.selectedVariables === this.identifier;
    }
  }
}
</script>

<style scoped lang="scss">
@import '../../../../styles/variables';
$base-color: #19181a;
$active-color-dark: #16406a;
$active-color: #2a66a1;
$active-color-light: #dde6f0;
$active-color-extra-light: #f8f7fa;

.widget-variable-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 10px;
  border-radius: 2px;
  font-family: 'Montserrat', sans-serif;
}

.widget-variable-option--selected {
  background: $active-color-light;
  .widget-variable-option__name {
    color: $active-color-dark;
  }
  .widget-variable-option__value {
    color: $active-color;
  }
  .widget-variable-option__toggle {
    background: $active-color;
    border-color: $active-color;
    &::before,
    &::after {
      background: white;
      opacity: 1;
    }
  }
}

.widget-variable-option__container {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.widget-variable-option__name {
  font-size: 13px;
  color: $base-color;
  font-weight: 500;
  flex: 1 50%;
}

.widget-variable-option__value {
  font-size: 11px;
  font-weight: 500;
  color: #979797;
  flex-shrink: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  margin-left: 1em;
}

.widget-variable-option__toggle {
  position: relative;
  background: white;
  width: 12px;
  height: 12px;
  border: 1px solid $active-color-light;
  border-radius: 1px;
  margin-right: 10px;

  &:active,
  &:focus,
  &:hover {
    border-color: $active-color;
  }

  &::before,
  &::after {
    content: '';
    order: -1;
    display: block;
    background: $active-color;
    height: 2px;
    top: 4px;
    position: absolute;
    opacity: 0;
  }

  &::before {
    right: 1px;
    width: 7px;
    transform: rotate(-45deg);
  }

  &::after {
    left: 1px;
    width: 3px;
    transform: rotate(45deg);
  }
}

.widget-variable-option:hover {
  background-color: $active-color-extra-light;
  .widget-variable-option__name {
    color: $active-color;
  }
  .widget-variable-option__value {
    color: #979797;
  }
  .widget-variable-option__toggle {
    border-color: $active-color-light;
  }
}

.widget-variable-option--selected:hover {
  .widget-variable-option-toggle {
    background: $active-color;
  }
}
</style>
