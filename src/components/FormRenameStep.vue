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
        v-on:click="validateStep"
      >OK</button>
      <button
        class="widget-form-action__button widget-form-action__button--cancel"
        v-on:click="cancelEdition"
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
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';
import FormMixin from '@/mixins/FormMixin.vue';
import renameSchema from '@/assets/schemas/rename-step__schema.json';
import WidgetInputText from './WidgetInputText.vue';
import WidgetAutocomplete from '@/components/WidgetAutocomplete.vue';
import { Getter, Mutation } from 'vuex-class';

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

  step: RenameStepConf = this.initialValue;

  @Mutation toggleColumnSelection!: (column: string) => void;

  @Getter selectedColumns!: string[];
  @Getter columnNames!: string[];

  @Watch('selectedColumns')
  onSelectedColumnsChanged(val: string[], oldVal: string[]) {
    if (val != oldVal) {
      this.step.oldname = val[0];
    }
  }

  created() {
    this.schema = renameSchema;
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
