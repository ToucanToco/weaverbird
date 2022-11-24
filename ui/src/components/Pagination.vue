<template>
  <div class="pagination">
    <paginate
      v-if="showPager"
      :value="pageNumber"
      :page-count="pageCount"
      containerClass="pagination__list"
      prev-class="prevnext"
      next-class="prevnext"
      :clickHandler="pageClicked"
    />
    <div
      v-if="paginationCounterText"
      data-testid="weaverbird-pagination-counter"
      class="pagination-counter"
    >
      {{ paginationCounterText }}
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import Paginate from 'vuejs-paginate';

import { numberOfPages, counterText, shouldUseArrowPagination } from '@/lib/dataset/pagination';
import type { PaginationContext } from '@/lib/dataset/pagination';

@Component({
  name: 'pagination',
  components: {
    Paginate,
  },
})
export default class Pagination extends Vue {
  @Prop()
  paginationContext!: PaginationContext;

  useArrowPagination = false;

  get showPager(): boolean {
    return this.paginationContext.shouldPaginate;
  }

  get pageCount() {
    if (this.paginationContext) {
      return numberOfPages(this.paginationContext);
    }
    return 1;
  }

  get pageNumber() {
    if (this.paginationContext) {
      return this.paginationContext.pageNumber;
    }
    return 1;
  }

  get paginationCounterText() {
    return counterText({
      useArrowPagination: false,
      paginationContext: this.paginationContext,
      pageCount: this.pageCount,
    });
  }

  @Watch('paginationContext', { immediate: true })
  setUseArrowPagination(
    paginationContext: PaginationContext,
    oldPaginationContext: PaginationContext,
  ) {
    this.useArrowPagination = shouldUseArrowPagination(paginationContext, oldPaginationContext);
  }

  pageClicked(pageNumber: number) {
    this.$emit('setPage', { pageNumber });
  }
}
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
.pagination-counter {
  background: #999;
  bottom: 0;
  color: #fff;
  display: flex;
  padding: 4px 10px;
  position: absolute;
}
</style>
