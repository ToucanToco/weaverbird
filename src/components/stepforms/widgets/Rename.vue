<template>
  <div class="widget-to-rename__container">
    <ColumnPicker
      class="columnToRename"
      name
      v-model="columnToRename"
      placeholder="Column to rename"
      :syncWithSelectedColumn="false"
      :data-path="`${dataPath}[0]`"
      :errors="errors"
    />
    <InputTextWidget
      class="newColumn"
      v-model="newColumnToRename"
      placeholder="New column name"
      :data-path="`${dataPath}[1]`"
      :warning="duplicateColumnName"
      :errors="errors"
    />
  </div>
</template>
<script lang="ts">
import { ErrorObject } from 'ajv';
import isEqual from 'lodash/isEqual';
import { Component, Prop, Vue } from 'vue-property-decorator';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import { VQBModule } from '@/store';

import InputTextWidget from './InputText.vue';

@Component({
  name: 'rename-widget',
  components: {
    ColumnPicker,
    InputTextWidget,
  },
})
export default class RenameWidget extends Vue {
  @Prop({
    type: Array,
    default: () => ['', ''],
  })
  value!: string[];

  @Prop({ type: String, default: null })
  dataPath!: string;

  @Prop({ type: Array, default: () => [] })
  errors!: ErrorObject[];

  @VQBModule.Getter columnNames!: string[];

  created() {
    if (isEqual(this.value, ['', ''])) {
      this.update(this.value);
    }
  }

  get columnToRename() {
    return this.value[0];
  }

  set columnToRename(newColumnName) {
    this.update([newColumnName, this.newColumnToRename]);
  }

  get duplicateColumnName() {
    if (this.columnNames.includes(this.newColumnToRename)) {
      return `A column name "${this.newColumnToRename}" already exists. You will overwrite it.`;
    } else {
      return null;
    }
  }

  get newColumnToRename() {
    return this.value[1];
  }

  set newColumnToRename(newColumnName) {
    this.update([this.columnToRename, newColumnName]);
  }

  update(newValues: string[]) {
    this.$emit('input', newValues);
  }
}
</script>
<style lang="scss" scoped>
.widget-to-rename__container {
  background-color: white;
  display: flex;
  min-height: 45px;
  width: 100%;
}

.widget-autocomplete__container {
  width: 50%;

  /deep/ .widget-input-variable {
    width: 90%;
  }
}

.widget-input-text__container {
  margin-bottom: 0px;
  margin-left: 5px;
  margin-right: 5px;
  width: 50%;

  /deep/ .widget-input-variable {
    width: 90%;
  }
}
</style>
