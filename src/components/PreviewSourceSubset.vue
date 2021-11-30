<template>
  <div v-if="previewSourceRowsSubset" class="preview-source-rows-subset">
    <p>Configurable "preview source" subset (beta)</p>
    <div>
      <input v-model.number="rowsSubsetInput" type="number" min="1" />
      rows
      <button @click="refreshPreview">Refresh</button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';

import { VQBModule } from '@/store';
import { MutationCallbacks } from '@/store/mutations';

@Component({
  name: 'PreviewSourceSubset',
})
export default class PreviewSourceSubset extends Vue {
  rowsSubsetInput: number | string | undefined = this.lastSuccessfulPreviewRowsSubset;

  @VQBModule.Getter('previewSourceRowsSubset') previewSourceRowsSubset?:
    | number
    | 'unlimited'
    | undefined;

  @VQBModule.Action updateDataset!: () => void;
  @VQBModule.Mutation setPreviewSourceRowsSubset!: MutationCallbacks['setPreviewSourceRowsSubset'];

  get lastSuccessfulPreviewRowsSubset() {
    return this.previewSourceRowsSubset == 'unlimited'
      ? 100000000 // we don't support 'unlimited' value (yet ?), use an arbitrary number instead
      : this.previewSourceRowsSubset;
  }

  @Watch('lastSuccessfulPreviewRowsSubset', { immediate: true })
  updateRowsSubset() {
    this.rowsSubsetInput = this.lastSuccessfulPreviewRowsSubset;
  }

  refreshPreview() {
    this.setPreviewSourceRowsSubset({
      previewSourceRowsSubset:
        typeof this.rowsSubsetInput === 'number' ? this.rowsSubsetInput : undefined,
    });
    this.updateDataset();
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/_variables';

.preview-source-rows-subset {
  margin: 30px 0;
  padding-left: 48px;
  width: 100%;
  border-top: 1px solid $grey-light;

  input {
    width: 90px;
  }
}
</style>
