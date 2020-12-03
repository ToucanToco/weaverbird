<template>
  <div class="widget-join-column__container">
    <AutocompleteWidget
      class="leftOn"
      v-model="leftOnColumn"
      placeholder="Current dataset column"
      :options="columnNames"
      :data-path="`${dataPath}[0]`"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <InputTextWidget
      class="rightOn"
      v-model="rightOnColumn"
      placeholder="Right dataset column"
      :data-path="`${dataPath}[1]`"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
  </div>
</template>
<script lang="ts">
import { ErrorObject } from 'ajv';
import { Component, Prop, Vue } from 'vue-property-decorator';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import InputTextWidget from './InputText.vue';

@Component({
  name: 'join-colum-widget',
  components: {
    AutocompleteWidget,
    InputTextWidget,
  },
})
export default class JoinColumns extends Vue {
  @Prop({
    type: Array,
    default: () => ['', ''],
  })
  value!: string[];

  @Prop({ type: String, default: null })
  dataPath!: string;

  @Prop({ type: Array, default: () => [] })
  errors!: ErrorObject[];

  @Prop()
  availableVariables?: VariablesBucket;

  @Prop()
  variableDelimiters?: VariableDelimiters;

  @VQBModule.Getter columnNames!: string[];

  get leftOnColumn() {
    return this.value[0];
  }

  set leftOnColumn(newLeftOnColumn) {
    // If no right column, set it to the same as left column (smart default)
    const newRightColumn = this.rightOnColumn === '' ? newLeftOnColumn : this.rightOnColumn;
    this.update([newLeftOnColumn, newRightColumn]);
  }

  get rightOnColumn() {
    return this.value[1];
  }

  set rightOnColumn(newRightOnColumn) {
    this.update([this.leftOnColumn, newRightOnColumn]);
  }

  update(newJoinColumns: string[]) {
    this.$emit('input', newJoinColumns);
  }
}
</script>
<style lang="scss" scoped>
.widget-join-column__container {
  background-color: white;
  display: flex;
  min-height: 45px;
  width: 100%;
}

.widget-join-column__container ::v-deep .widget-autocomplete__container {
  width: 50%;
}

.widget-join-column__container ::v-deep .widget-input-text__container {
  margin-bottom: 0px;
  margin-left: 10px;
  margin-right: 5px;
  width: 50%;
}

.widget-join-column__container ::v-deep .multiselect {
  width: 100%;
  margin-right: 10px;
}
</style>
