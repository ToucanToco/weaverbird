<template>
  <div :class="toggleCheckedClass" @click="toggleValue">
    <label :title="title" :for="label" class="widget-checkbox__label">{{ label }}</label>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({
  name: 'checkbox-widget',
})
export default class CheckboxWidget extends Vue {
  @Prop({ type: String, default: null })
  label!: string;

  @Prop({ type: Boolean, default: false })
  croppedLabel?: boolean;

  @Prop({ type: Boolean, default: true })
  value!: boolean;

  get toggleCheckedClass() {
    return {
      'widget-checkbox': true,
      'widget-checkbox--checked': this.value,
      'widget-checkbox--cropped': this.croppedLabel,
    };
  }

  get title(): string | undefined {
    return this.croppedLabel ? this.label : undefined;
  }

  toggleValue() {
    this.$emit('input', !this.value);
  }
}
</script>

<style lang="scss" scoped>
@import '../../../styles/_variables';
.widget-checkbox {
  align-items: center;
  display: flex;
  margin-bottom: 20px;
  cursor: pointer;

  &:active,
  &:focus,
  &:hover {
    &::after {
      opacity: 0.3;
    }
  }

  &::before,
  &::after {
    content: '';
    order: -1;
  }

  &::before {
    flex: 0 auto;
    box-shadow: 0 0 0 2px $base-color inset;
    height: 24px;
    width: 24px;
    min-width: 24px;
  }

  &::after {
    box-shadow: 3px -3px 0 0 $base-color inset;
    height: 8px;
    margin-left: -18px;
    margin-right: 6px;
    margin-top: -3px;
    opacity: 0.1;
    transform: rotate(-45deg);
    width: 12px;
  }
}

.widget-checkbox--checked {
  &::before {
    box-shadow: 0 0 0 2px $base-color inset;
  }

  &::after {
    box-shadow: 3px -3px 0 0 $base-color inset;
    opacity: 1;
  }

  &:active,
  &:focus,
  &:hover {
    &::after {
      opacity: 1;
    }
  }
}

.widget-checkbox__label {
  @extend %form-widget__label;
  flex: 1;
  margin-top: 0;
  margin-bottom: 0;
  align-self: center;
  margin-left: 8px;
  cursor: pointer;
}

.widget-checkbox--cropped {
  .widget-checkbox__label {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
