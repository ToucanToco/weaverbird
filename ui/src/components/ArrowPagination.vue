<script lang="ts">
import Vue, { defineComponent } from 'vue';

import FAIcon from '@/components/FAIcon.vue';

import VPopover from 'v-tooltip';
Vue.use(VPopover);

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

    <v-popover
      class="arrow-pagination__tooltip"
      popoverClass="weaverbird__tooltip"
      placement="top-start"
      trigger="hover"
    >
      <button
        :disabled="currentPage === 1"
        class="arrow-pagination__button arrow-pagination__button--prev"
        @click="selectPage(currentPage - 1)"
      >
        Prev
      </button>
      <template slot="popover">
        <FAIcon icon="alert" aria-label="Unknown page number" />
        <span>The rows and pages number is not available with this connector</span>
      </template>
    </v-popover>

    <v-popover
      class="arrow-pagination__tooltip"
      popoverClass="weaverbird__tooltip"
      placement="top-start"
      trigger="hover"
    >
      <button
        :disabled="isLastPage"
        class="arrow-pagination__button arrow-pagination__button--next"
        @click="selectPage(currentPage + 1)"
      >
        Next
      </button>
      <template slot="popover">
        <FAIcon icon="alert" aria-label="Unknown page number" />
        <span>The rows and pages number is not available with this connector</span>
      </template>
    </v-popover>
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
