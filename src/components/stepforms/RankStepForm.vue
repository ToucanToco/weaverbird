<template>
  <div>
    <StepFormHeader :title="title" :stepName="this.editedStep.name" />
    <ColumnPicker
      v-model="editedStep.column"
      class="columnInput"
      name="Column:"
      placeholder="Enter the column name to rank"
      data-path=".column"
      :errors="errors"
    />
    <InputTextWidget
      class="rankColumnNameInput"
      v-model="editedStep.rankColumnName"
      name="Rank column name:"
      placeholder="Rank"
      data-path=".rankColumnName"
      :errors="errors"
    />
    <AutocompleteWidget
      class="sortOrderInput"
      v-model="editedStep.sortOrder"
      name="Order"
      :options="['asc', 'desc']"
      placeholder="Order by"
      data-path=".sortOrder"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { RankStep } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

@StepFormComponent({
  vqbstep: 'rank',
  name: 'rank-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
    AutocompleteWidget,
  },
})
export default class RankStepForm extends BaseStepForm<RankStep> {
  @Prop({
    type: Object,
    default: () => ({ name: 'rank', column: '', rankColumnName: '', sortOrder: 'asc' }),
  })
  initialStepValue!: RankStep;

  readonly title: string = 'Rank';

  // submit() {
  //   this.$$super.submit();
  //   if (this.errors === null) {
  //     this.setSelectedColumns({ column: this.editedStep.rankColumnName });
  //   }
  // }
}
</script>
