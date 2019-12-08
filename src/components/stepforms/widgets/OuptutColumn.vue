<template>
  <InputTextWidget
    :id="id"
    name="New column:"
    :value="value"
    placeholder="Enter the output column name"
    :errors="errors"
    :warning="duplicateColumnName"
    @input="updateValue"
  />
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator';
import { VQBModule } from '@/store';
import InputTextWidget from './InputText.vue';
import FormWidget from './FormWidget.vue';

@Component({
  name: 'output-column-widget',
  components: {
    InputTextWidget,
  }
})
export default class OutputColumnWidget extends Mixins(FormWidget) {
  @Prop({ type: String, default: null })
  id!: string;

  @Prop({ default: '' })
  value!: string;

  @VQBModule.Getter columnNames!: string[];

  get duplicateColumnName() {
    if (this.columnNames.includes(this.value)) {
      return `A column name "${this.value}" already exists. You will overwrite it.`;
    } else {
      return null;
    }
  }

  updateValue(newValue: string) {
    this.$emit('input', newValue);
  }
}
</script>
