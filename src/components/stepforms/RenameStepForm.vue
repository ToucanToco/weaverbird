<template>
  <div>
    <StepFormHeader :title="title" :stepName="this.editedStep.name" :version="version" />
    <ListWidget
      addFieldName="Add column"
      class="toReplace"
      name="Columns to rename:"
      placeholderOldVal="Column to rename"
      placeholderNewVal="New value"
      v-model="toRename"
      :defaultItem="['', '']"
      :widget="renameWidget"
      :automatic-new-field="false"
      data-path=".toRename"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import ListWidget from '@/components/stepforms/widgets/List.vue';
import RenameWidget from '@/components/stepforms/widgets/Rename.vue';
import { RenameStep } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

@StepFormComponent({
  vqbstep: 'rename',
  name: 'rename-step-form',
  components: {
    ListWidget,
  },
})
export default class RenameStepForm extends BaseStepForm<RenameStep> {
  @Prop({ type: Object, default: () => ({ name: 'rename', toRename: [['', '']] }) })
  initialStepValue!: RenameStep;

  readonly title: string = 'Rename Column';
  renameWidget = RenameWidget;

  /** Overload the definition of editedStep in BaseStepForm to guarantee retrocompatibility,
   *  as we have to manage historical configurations where only one column at a time could be
   * renamed via the 'newname' and 'oldname' parameter, now optional and not useful. So we
   * convert them into a 'toRename' array upfront */
  editedStep = {
    ...this.initialStepValue,
    ...this.stepFormDefaults,
    toRename:
      this.initialStepValue.oldname && this.initialStepValue.newname
        ? [[this.initialStepValue.oldname, this.initialStepValue.newname]]
        : this.initialStepValue.toRename,
    oldname: undefined,
    newname: undefined,
  };

  get stepSelectedColumn() {
    return null;
  }

  set stepSelectedColumn(colname: string | null) {
    if (colname === null) {
      throw new Error('should not try to set null in rename "toRename" field');
    }
    if (colname !== null && this.editedStep.toRename[0][0] === '') {
      this.editedStep.toRename[0].splice(0, 1, colname);
    }
  }

  get toRename() {
    return this.editedStep.toRename;
  }

  set toRename(newval) {
    this.editedStep.toRename = [...newval];
  }

  submit() {
    this.$$super.submit();
    if (this.errors === null) {
      this.setSelectedColumns({
        column: this.editedStep.toRename[this.editedStep.toRename.length - 1][1],
      });
    }
  }
}
</script>
