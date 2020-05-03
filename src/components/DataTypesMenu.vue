<template>
  <Menu @closed="$emit('closed')" :visible="visible" :buttons="buttons" />
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import { DATA_TYPE, DataType } from '@/components/constants';
import Menu, { ButtonsList } from '@/components/Menu.vue';
import { ConvertStep, Pipeline } from '@/lib/steps';
import { VQBModule } from '@/store';
import { MutationCallbacks } from '@/store/mutations';

@Component({
  name: 'data-types-menu',
  components: {
    Menu,
  },
})
export default class DataTypesMenu extends Vue {
  @Prop({
    type: String,
    default: () => '',
  })
  columnName!: string;

  @Prop({
    type: Boolean,
    default: true,
  })
  visible!: boolean;

  @VQBModule.Getter computedActiveStepIndex!: number;
  @VQBModule.Getter isEditingStep!: boolean;
  @VQBModule.Getter pipeline?: Pipeline;

  @VQBModule.Mutation selectStep!: MutationCallbacks['selectStep'];
  @VQBModule.Mutation setPipeline!: MutationCallbacks['setPipeline'];
  @VQBModule.Mutation closeStepForm!: () => void;

  createConvertStep(dataType: DataType) {
    const newPipeline: Pipeline = [...this.pipeline];
    const index = this.computedActiveStepIndex + 1;
    const convertStep: ConvertStep = {
      name: 'convert',
      columns: [this.columnName],
      data_type: dataType,
    };
    // If a step edition form is already open, close it so that the left panel
    // displays the pipeline with the new delete step inserted
    if (this.isEditingStep) {
      this.closeStepForm();
    }
    newPipeline.splice(index, 0, convertStep);
    this.setPipeline({ pipeline: newPipeline });
    this.selectStep({ index });
    this.$emit('closed');
  }

  readonly buttons: ButtonsList = DATA_TYPE.map(({ name, icon }) => ({
    html: `<span class="data-types-menu__icon">${icon}</span><span style="text-transform: capitalize;">${name}</span>`,
    onclick: () => this.createConvertStep(name),
  }));
}
</script>
<style lang="scss" scoped>
/deep/ .data-types-menu__icon {
  font-family: 'Roboto Slab', serif;
  width: 30%;
}
</style>
