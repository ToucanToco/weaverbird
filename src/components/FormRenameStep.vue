<template>
  <div>
    <div class="step-edit-form">
      <h1 class="step-edit-form__title">EDIT RENAME STEP</h1>
    </div>
    <WidgetAutocomplete
      id="oldnameInput"
      v-model="step.oldname"
      name="Old name"
      :options="columnNames"
      placeholder="Enter the old column name"
      @input="toggleColumnSelection(step.oldname)"
    ></WidgetAutocomplete>
    <WidgetInputText
      id="newnameInput"
      v-model="step.newname"
      name="New name"
      placeholder="Enter a new column name"
    ></WidgetInputText>
    <div class="widget-form-action">
      <button
        class="widget-form-action__button widget-form-action__button--validate"
        @click="validateStep"
      >OK</button>
      <button
        class="widget-form-action__button widget-form-action__button--cancel"
        @click="cancelEdition"
      >Cancel</button>
    </div>
    <div v-if="errors" class="errors">
      <ul>
        <li v-for="(error, index) in errors" :key="index">{{ error.dataPath }}: {{ error.message }}</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash';
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import FormMixin from '@/mixins/FormMixin.vue';
import { Pipeline } from '@/lib/steps';
import renameSchema from '@/assets/schemas/rename-step__schema.json';
import WidgetInputText from './WidgetInputText.vue';
import WidgetAutocomplete from '@/components/WidgetAutocomplete.vue';
import { Getter, Mutation, State } from 'vuex-class';

interface RenameStepConf {
  oldname: string;
  newname: string;
}

@Component({
  name: 'form-rename-step',
  components: {
    WidgetAutocomplete,
    WidgetInputText,
  },
})
export default class FormRenameStep extends Mixins(FormMixin) {
  @Prop({
    type: Object,
    default: () => ({
      oldname: '',
      newname: '',
    }),
  })
  initialValue!: RenameStepConf;

  @Prop({
    type: Boolean,
    default: () => true,
  })
  isStepCreation!: boolean;

  step: RenameStepConf = this.initialValue;

  @State pipeline!: Pipeline;
  @State selectedStepIndex!: number;

  @Mutation selectStep!: (payload: { index: number }) => void;
  @Mutation toggleColumnSelection!: (column: string) => void;

  @Getter selectedColumns!: string[];
  @Getter columnNames!: string[];

  @Watch('selectedColumns')
  onSelectedColumnsChanged(val: string[], oldVal: string[]) {
    if (!_.isEqual(val, oldVal)) {
      this.step.oldname = val[0];
    }
  }

  created() {
    this.schema = renameSchema;
    this.toggleColumnSelection(this.initialValue.oldname);
  }

  validateStep() {
    const ret = this.validator(this.step);
    if (ret === false) {
      this.errors = this.validator.errors;
    } else {
      this.errors = null;
      this.$emit('formSaved', { name: 'rename', ...this.step });
    }
  }

  cancelEdition() {
    this.$emit('cancel');
    let idx = this.pipeline.length;
    if (!this.isStepCreation) {
      // When a edition is for modification of an existing step, the selected step
      // is the one just above, and we want to get back to the existing step when canceling
      idx = this.selectedStepIndex + 1;
    } else {
      idx = this.selectedStepIndex !== -1 ? this.selectedStepIndex : idx;
    }
    this.selectStep({ index: idx });
  }
}
</script>
<style lang="scss" scoped>
@import '../styles/_variables';

.widget-form-action__button {
  @extend %button-default;
}

.widget-form-action__button--validate {
  background: $blue;
}

.step-edit-form {
  border-bottom: 1px solid $grey;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding-bottom: 20px;
  margin: 10px 0 15px;
  width: 100%;
}

.step-edit-form__title {
  color: $base-color;
  font-weight: 600;
  font-size: 14px;
  margin: 0;
}
</style>
