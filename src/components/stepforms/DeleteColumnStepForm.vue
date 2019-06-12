<template>
  <div>
    <div class="step-edit-form">
      <h1 class="step-edit-form__title">DELETE COLUMN STEP</h1>
    </div>
    <WidgetAutocomplete
      id="columnInput"
      v-model="column"
      name="Delete column:"
      :options="columnNames"
      @input="setSelectedColumns({ column })"
      placeholder="Enter a column"
    ></WidgetAutocomplete>
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
import { Mixins, Prop, Watch } from 'vue-property-decorator';
import FormMixin from '@/mixins/FormMixin.vue';
import { Pipeline } from '@/lib/steps';
import deleteSchema from '@/assets/schemas/delete-column-step__schema.json';
import WidgetAutocomplete from '@/components/stepforms/WidgetAutocomplete.vue';
import { Getter, Mutation, State } from 'vuex-class';
import { StepFormComponent } from '@/components/formlib';
import { MutationCallbacks } from '@/store/mutations';

interface DeleteColumnStepConf {
  columns: string[];
}

@StepFormComponent({
  vqbstep: 'delete',
  name: 'delete-step-form',
  components: {
    WidgetAutocomplete,
  },
})
export default class DeletStepForm extends Mixins(FormMixin) {
  @Prop({
    type: Object,
    default: () => ({
      columns: [''],
    }),
  })
  initialValue!: DeleteColumnStepConf;

  @Prop({
    type: Boolean,
    default: true,
  })
  isStepCreation!: boolean;

  // Only manage the deletion of 1 column at once at this stage
  column: string = this.initialValue.columns[0];

  @State pipeline!: Pipeline;
  @State selectedStepIndex!: number;

  @Mutation selectStep!: MutationCallbacks['selectStep'];
  @Mutation setSelectedColumns!: MutationCallbacks['setSelectedColumns'];

  @Getter selectedColumns!: string[];
  @Getter columnNames!: string[];
  @Getter computedActiveStepIndex!: number;

  @Watch('selectedColumns')
  onSelectedColumnsChanged(val: string[], oldVal: string[]) {
    if (!_.isEqual(val, oldVal)) {
      this.column = val[0];
    }
  }

  created() {
    this.schema = deleteSchema;
    this.setSelectedColumns({ column: this.initialValue.columns[0] });
  }

  validateStep() {
    const ret = this.validator({ column: this.column });
    if (ret === false) {
      this.errors = this.validator.errors;
    } else {
      this.errors = null;
      this.$emit('formSaved', { name: 'delete', columns: [this.column] });
    }
  }

  cancelEdition() {
    this.$emit('cancel');
    const idx = this.isStepCreation ? this.computedActiveStepIndex : this.selectedStepIndex + 1;
    this.selectStep({ index: idx });
  }
}
</script>
<style lang="scss" scoped>
@import '../../styles/_variables';

.widget-form-action__button {
  @extend %button-default;
}

.widget-form-action__button--validate {
  background-color: $active-color;
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
