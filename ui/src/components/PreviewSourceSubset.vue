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
import { defineComponent } from 'vue';
import { useVQBStore, VQBModule, type VQBActions } from '@/store';

import FAIcon from '@/components/FAIcon.vue';

export default defineComponent({
  name: 'PreviewSourceSubset',
  
  components: {
    FAIcon,
  },
  
  data() {
    const store = useVQBStore();
    const initialValue = store.previewSourceRowsSubset === 'unlimited' 
      ? 100000000 // we don't support 'unlimited' value (yet ?), use an arbitrary number instead
      : store.previewSourceRowsSubset;
    
    return {
      rowsSubsetInput: initialValue as number | string | undefined
    };
  },
  
  computed: {
    previewSourceRowsSubset(): number | 'unlimited' | undefined {
      return useVQBStore().previewSourceRowsSubset;
    },
    
    lastSuccessfulPreviewRowsSubset() {
      return this.previewSourceRowsSubset === 'unlimited'
        ? 100000000 // we don't support 'unlimited' value (yet ?), use an arbitrary number instead
        : this.previewSourceRowsSubset;
    }
  },
  
  watch: {
    lastSuccessfulPreviewRowsSubset: {
      handler() {
        this.rowsSubsetInput = this.lastSuccessfulPreviewRowsSubset;
      },
      immediate: true
    }
  },
  
  methods: {
    refreshPreview() {
      const store = useVQBStore();
      store.setPreviewSourceRowsSubset({
        previewSourceRowsSubset:
          typeof this.rowsSubsetInput === 'number' ? this.rowsSubsetInput : undefined,
      });
      store.updateDataset();
    }
  }
});
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
