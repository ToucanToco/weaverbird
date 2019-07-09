<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <div class="filter-step-form-body__container">
      <WidgetFilterSimpleCondition
        id="columnInput"
        v-model="editedStep.condition"
        @input="updateEditedStep"
      ></WidgetFilterSimpleCondition>
    </div>
    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { StepFormComponent } from '@/components/formlib';
import WidgetFilterSimpleCondition from '@/components/stepforms/WidgetFilterSimpleCondition.vue';
import BaseStepForm from './StepForm.vue';
import { FilterStep } from '@/lib/steps';
import { FilterSimpleCondition } from '@/lib/steps';

@StepFormComponent({
  vqbstep: 'filter',
  name: 'filter-step-form',
  components: {
    WidgetFilterSimpleCondition,
  },
})
export default class FilterStepForm extends BaseStepForm<FilterStep> {
  @Prop({
    type: Object,
    default: () => ({ name: 'filter', condition: { column: '', value: '', operator: 'eq' } }),
  })
  initialStepValue!: FilterStep;

  readonly title: string = 'Filter';

  updateEditedStep(newStepCondition: FilterSimpleCondition) {
    this.editedStep = { name: 'filter', condition: { ...newStepCondition } };
  }
}
</script>
<style lang="scss" scoped>
.filter-step-form-body__container {
  display: flex;
}

.filter-step-form-body__container .widget-autocomplete__container {
  margin-right: 10px;
}

.filter-step-form-body__container .widget-input-text__container {
  margin-top: 20px;
}
</style>

