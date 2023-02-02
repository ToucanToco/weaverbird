<template>
  <div class="preview-source-rows-subset" data-cy="weaverbird-preview-source-rows-subset">
    <span class="preview-source-rows-subset__text">Preview computation on the first</span>
    <div class="preview-source-rows-subset__wrapper">
      <input
        class="preview-source-rows-subset__input"
        data-cy="weaverbird-preview-source-rows-subset-input"
        v-model.number="rowsSubsetInput"
        type="number"
        min="1"
        @click.stop
      />
      <span
        class="preview-source-rows-subset__button"
        data-cy="weaverbird-preview-source-rows-subset-refresh"
        @click.stop="refreshPreview"
      >
        <FAIcon icon="sync-alt" />
      </span>
    </div>
    <span class="preview-source-rows-subset__text">rows</span>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Watch } from 'vue-property-decorator';

import FAIcon from '@/components/FAIcon.vue';
import { Action, Getter } from 'pinia-class';
import { VQBModule, type VQBActions } from '@/store';

@Component({
  name: 'PreviewSourceSubset',
  components: {
    FAIcon,
  },
})
export default class PreviewSourceSubset extends Vue {
  rowsSubsetInput: number | string | undefined = this.lastSuccessfulPreviewRowsSubset;

  @Getter(VQBModule, 'previewSourceRowsSubset') previewSourceRowsSubset?:
    | number
    | 'unlimited'
    | undefined;

  @Action(VQBModule) updateDataset!: VQBActions['updateDataset'];
  @Action(VQBModule) setPreviewSourceRowsSubset!: VQBActions['setPreviewSourceRowsSubset'];

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
  padding: 7px 12px;
  width: 100%;
  background: $active-color;
  display: flex;
  align-items: center;
  font-size: 12px;
}
.preview-source-rows-subset__text {
  color: white;
  letter-spacing: 0.5px;
  font-weight: 500;
}
.preview-source-rows-subset__wrapper {
  width: 110px;
  margin: 0 10px;
  padding: 3px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  background: white;
  height: 100%;
  border-radius: 2px;
}
.preview-source-rows-subset__input {
  border: none;
  width: 100%;
  flex: 1;
  height: 25px;
  &:focus {
    outline: none;
  }
}
.preview-source-rows-subset__button {
  background: $active-color;
  color: white;
  padding: 7px;
  font-size: 10px;
  border-radius: 2px;
  cursor: pointer;
}
</style>
