<template>
  <AutocompleteWidget
    id=":id"
    v-model="column"
    :name="name"
    :options="columnNames"
    @input="valueChanged"
    :placeholder="placeholder"
  ></AutocompleteWidget>
</template>

<script lang="ts">
import _ from 'lodash';
import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { Getter, Mutation } from 'vuex-class';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import { VQBModule } from '@/store';
import { MutationCallbacks } from '@/store/mutations';

@Component({ components: { AutocompleteWidget } })
export default class ColumnPicker extends Vue {
  @Prop({ type: String, default: 'columnInput' })
  id!: string;

  @Prop({ type: String, default: 'column' })
  name!: string;

  @Prop({ type: String, default: 'Enter a column' })
  placeholder!: string;

  @Prop({ type: String, default: null })
  initialColumn!: string | null;

  // Only manage the deletion of 1 column at once at this stage
  column: string | null = null;

  @VQBModule.Mutation setSelectedColumns!: MutationCallbacks['setSelectedColumns'];
  @VQBModule.Getter selectedColumns!: string[];
  @VQBModule.Getter columnNames!: string[];

  created() {
    if (this.initialColumn === null) {
      const selected = this.selectedColumns;
      if (selected.length) {
        this.column = selected[0];
      }
    } else {
      this.column = this.initialColumn;
      this.setSelectedColumns({ column: this.initialColumn });
    }
  }

  valueChanged() {
    if (this.column) {
      // make sure to emit @input so that v-model in hosting component is notified
      this.$emit('input', this.column);
      this.setSelectedColumns({ column: this.column });
    }
  }

  @Watch('selectedColumns')
  onSelectedColumnsChanged(val: string[], oldVal: string[]) {
    if (!_.isEqual(val, oldVal)) {
      this.column = val[0];
    }
  }
}
</script>
