<template>
  <div>
    <div class="step-edit-form">
      <h1 class="step-edit-form__title">AGGREGATE STEP</h1>
    </div>
    <WidgetMultiselect
      id="groupbyColumnsInput"
      v-model="step.on"
      name="Group by:"
      :options="columnNames"
      @input="setSelectedColumns({ column: step.on[0] })"
      placeholder="Add columns"
    ></WidgetMultiselect>
    <WidgetList
      id="toremove"
      name="Aggregation"
      :widget="'widget-aggregation'"
      :automatic-new-field="false"
    ></WidgetList>
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
import { Mixins, Prop } from 'vue-property-decorator';
import FormMixin from '@/mixins/FormMixin.vue';
import { AggregationStep, Pipeline } from '@/lib/steps';
import renameSchema from '@/assets/schemas/rename-step__schema.json';
import WidgetMultiselect from '@/components/WidgetMultiselect.vue';
import WidgetList from './WidgetList.vue';
import { Getter, Mutation, State } from 'vuex-class';
import { StepFormComponent } from '@/components/formlib';

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
type AggregateStepConf = Omit<AggregationStep, 'name'>;

@StepFormComponent({
  vqbstep: 'aggregate',
  name: 'aggregate-step-form',
  components: {
    WidgetList,
    WidgetMultiselect,
  },
})
export default class AggregateStepForm extends Mixins(FormMixin) {
  @Prop({
    type: Object,
    default: () => ({
      on: [],
      aggregations: [],
    }),
  })
  initialValue!: AggregateStepConf;

  @Prop({
    type: Boolean,
    default: true,
  })
  isStepCreation!: boolean;

  step: AggregateStepConf = { ...this.initialValue };

  @State pipeline!: Pipeline;
  @State selectedStepIndex!: number;

  @Mutation selectStep!: (payload: { index: number }) => void;
  @Mutation setSelectedColumns!: (payload: { column: string }) => void;

  // @Getter selectedColumns!: string[];
  @Getter columnNames!: string[];
  @Getter computedActiveStepIndex!: number;

  created() {
    this.schema = renameSchema;
    this.setSelectedColumns({ column: this.initialValue.on[0] });
  }

  validateStep() {
    // const ret = this.validator(this.step);
    // if (ret === false) {
    //   this.errors = this.validator.errors;
    // } else if (this.columnNames.includes(this.step.newname)) {
    //   const err = {
    //     keyword: 'nameAlreadyUsed',
    //     dataPath: '.newname',
    //     message: 'This column name is already used.',
    //   };
    //   this.errors = [err];
    // } else {
    //   this.errors = null;
    //   this.$emit('formSaved', { name: 'rename', ...this.step });
    //   this.setSelectedColumns({ column: this.step.newname });
    // }
  }

  cancelEdition() {
    this.$emit('cancel');
    const idx = this.isStepCreation ? this.computedActiveStepIndex : this.selectedStepIndex + 1;
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
