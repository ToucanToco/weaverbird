<script lang="ts">
import { defineComponent, type PropType } from 'vue';

import FAIcon from '@/components/FAIcon.vue';

export default defineComponent({
  name: 'ArrowPagination',
  components: {
    FAIcon,
  },

  props: {
    currentPage: {
      type: Number,
      default: 1,
    },
    isLastPage: {
      type: Boolean,
      default: false,
    },
  },

  methods: {
    selectPage(pageNumber: number): void {
      console.log('cocu');
      this.$emit('pageSelected', pageNumber);
    },
  },
});
</script>

<template>
  <div class="arrow-pagination">
    <button
      :disabled="currentPage === 1"
      aria-label="Go to first page"
      class="arrow-pagination__button arrow-pagination__button--first"
      @click="selectPage(1)"
    >
      <FAIcon icon="arrow-left" />
    </button>
    <button
      :disabled="currentPage === 1"
      class="arrow-pagination__button arrow-pagination__button--prev"
      @click="selectPage(currentPage - 1)"
    >
      Prev
    </button>
    <button
      :disabled="isLastPage"
      class="arrow-pagination__button arrow-pagination__button--next"
      @click="selectPage(currentPage + 1)"
    >
      Next
    </button>
  </div>
</template>

<style lang="scss" scoped>
.arrow-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow-pagination__button {
  border: 1px solid #eee;
  padding: 8px;
  font-size: 12px;
  line-height: 14px;
  cursor: pointer;
  background: none;
  box-shadow: none;
  height: 33px;

  &:disabled {
    opacity: 0.8;
    cursor: not-allowed;
  }
}
</style>
