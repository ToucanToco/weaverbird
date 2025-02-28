<template>
  <div class="pagination">
    <div v-if="showPager" class="pagination__nav">
      <ArrowPagination
        v-if="useArrowPagination"
        :currentPage="paginationContext.pageNumber"
        :isLastPage="paginationContext.isLastPage"
        @pageSelected="pageClicked"
      />
      <paginate
        v-else
        :value="pageNumber"
        :page-count="pageCount"
        containerClass="pagination__list"
        prev-class="prevnext"
        next-class="prevnext"
        :clickHandler="pageClicked"
      />
    </div>
    <div
      v-if="paginationCounterText"
      data-testid="weaverbird-pagination-counter"
      class="pagination__counter"
    >
      {{ paginationCounterText }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import Paginate from 'vuejs-paginate';

import ArrowPagination from '@/components/ArrowPagination.vue';
import { counterText, numberOfPages, shouldUseArrowPagination } from '@/lib/dataset/pagination';
import type { PaginationContext } from '@/lib/dataset/pagination';

export default defineComponent({
  name: 'pagination',
  
  components: {
    ArrowPagination,
    Paginate,
  },
  
  props: {
    paginationContext: {
      type: Object as PropType<PaginationContext>,
      required: true
    }
  },
  
  data() {
    return {
      useArrowPagination: false
    };
  },
  
  computed: {
    showPager(): boolean {
      return this.paginationContext.shouldPaginate;
    },
    
    pageCount() {
      if (this.paginationContext) {
        return numberOfPages(this.paginationContext);
      }
      return 1;
    },
    
    pageNumber() {
      if (this.paginationContext) {
        return this.paginationContext.pageNumber;
      }
      return 1;
    },
    
    paginationCounterText() {
      return counterText({
        useArrowPagination: false,
        paginationContext: this.paginationContext,
        pageCount: this.pageCount,
      });
    }
  },
  
  watch: {
    paginationContext: {
      immediate: true,
      handler(paginationContext: PaginationContext, oldPaginationContext: PaginationContext) {
        this.useArrowPagination = shouldUseArrowPagination(paginationContext, oldPaginationContext);
      }
    }
  },
  
  methods: {
    pageClicked(pageNumber: number) {
      this.$emit('setPage', { pageNumber });
    }
  }
});
</script>
<style lang="scss">
.pagination {
  text-align: center;
  font-size: 10px;
}

.pagination__list {
  display: flex;
  padding-left: 0;
  margin: 20px 0 0;
  border-radius: 4px;
  justify-content: center;
  list-style: none;
}

.pagination__list li a {
  display: block;
  padding: 6px 12px;
  margin-left: -1px;
  line-height: 1.42857143;
  color: #2665a3;
  text-decoration: none;
  background-color: #fff;
  border: 1px solid #ddd;
  outline: none;
}

.pagination__list li.disabled a {
  cursor: not-allowed;
  color: #777;
}

.pagination__list li.disabled.prevnext {
  display: none;
}

.pagination__list li.active a {
  cursor: not-allowed;
  background-color: #2665a3;
  color: #fff;
}
.pagination__counter {
  background: #999;
  bottom: 0;
  color: #fff;
  display: flex;
  padding: 4px 10px;
  position: absolute;
}
</style>
