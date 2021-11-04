<template>
  <div class="pagination">
    <paginate
      v-if="showPager"
      :value="pageNo"
      :page-count="pageCount"
      containerClass="pagination__list"
      prev-class="prevnext"
      next-class="prevnext"
      :clickHandler="pageClicked"
    />
    <div v-if="showPager" class="pagination-counter">
      <span class="pagination-counter__current-min">{{ pageRows.min }}</span>
      <span class="pagination-counter__current-max">&nbsp;- {{ pageRows.max }}</span>
      <span class="pagination-counter__total-count">&nbsp;of {{ totalCount }} rows</span>
    </div>
    <div v-else class="pagination-counter">
      <span class="pagination-counter__total-count">{{ totalCount }} rows</span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import Paginate from 'vuejs-paginate';

import { numberOfPages, pageMinMax, PaginationContext } from '@/lib/dataset/pagination';

@Component({
  name: 'pagination',
  components: {
    Paginate,
  },
})
export default class Pagination extends Vue {
  @Prop()
  paginationContext?: PaginationContext;

  get showPager(): boolean {
    return this.pageCount > 1;
  }

  get pageCount() {
    if (this.paginationContext) {
      return numberOfPages(this.paginationContext);
    }
    return 1;
  }

  get pageNo() {
    if (this.paginationContext) {
      return this.paginationContext.pageno;
    }
    return 1;
  }

  get totalCount() {
    if (this.paginationContext) {
      return this.paginationContext.totalCount;
    }
    return null;
  }

  get pageRows() {
    if (this.paginationContext) {
      return pageMinMax(this.paginationContext);
    }
    return 0;
  }

  pageClicked(pageno: number) {
    this.$emit('setPage', { pageno });
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
