<template>
  <Menu @closed="$emit('closed')" :visible="visible">
    <MenuOption v-for="type in types" :key="type.name" @click.native="createConvertStep(type.name)">
      <span class="data-types-menu__type-icon" v-html="type.icon" />
      <span class="data-types-menu__type-label">{{ type.name }}</span>
    </MenuOption>
  </Menu>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import { DATA_TYPE, DataType } from '@/components/constants';
import Menu from '@/components/Menu.vue';
import MenuOption from '@/components/Menu/MenuOption.vue';
import { ConvertStep, Pipeline } from '@/lib/steps';
import { VQBModule } from '@/store';
import { MutationCallbacks } from '@/store/mutations';

@Component({
  name: 'data-types-menu',
  components: {
    Menu,
    MenuOption,
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

  readonly types = DATA_TYPE;
}
</script>
<style lang="scss" scoped>
.data-types-menu__type-icon {
  font-family: 'Roboto Slab', serif;
  width: 30%;
}

.data-types-menu__type-label {
  text-transform: capitalize;
}
</style>
