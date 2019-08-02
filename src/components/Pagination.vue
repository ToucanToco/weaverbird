<template>
  <div class="pagination">
    <paginate
      :page-count="pageCount"
      containerClass="pagination__list"
      prev-class="prevnext"
      next-class="prevnext"
      :clickHandler="pageClicked"
    />
    <div class="pagination-counter">
      <span class="pagination-counter__current-min">{{ pageCurrentMinRow }}</span>
      <span
        class="pagination-counter__current-max"
        v-if="isCurrentMaxRow"
      >&nbsp;- {{ pageCurrentMaxRow }}</span>
      <span class="pagination-counter__total-count">&nbsp;of {{ totalCount }} rows</span>
    </div>
  </div>
</template>

<script lang="ts">
import Paginate from 'vuejs-paginate';
import { Vue, Component } from 'vue-property-decorator';
import { Mutation, State } from 'vuex-class';
import { DataSet } from '@/lib/dataset';
import { numberOfPages, pageOffset } from '@/lib/dataset/pagination';
import { MutationCallbacks } from '@/store/mutations';

@Component({
  name: 'pagination',
  components: {
    Paginate,
  },
})
export default class Pagination extends Vue {
  @State dataset!: DataSet;

  @Mutation setCurrentPage!: MutationCallbacks['setCurrentPage'];

  valueCurrentRow: number = 0;
  isCurrentMaxRow: boolean = true;

  get pageCount() {
    if (this.dataset.paginationContext) {
      return numberOfPages(this.dataset.paginationContext);
    }
    return 1;
  }

  get pageCurrentMinRow() {
    if (this.dataset.paginationContext) {
      this.valueCurrentRow =
        pageOffset(
          this.dataset.paginationContext.pagesize,
          this.dataset.paginationContext.pageno + 1,
        ) + 1;
      return this.valueCurrentRow;
    }
  }

  get pageCurrentMaxRow() {
    if (this.dataset.paginationContext) {
      return this.valueCurrentRow + this.dataset.paginationContext.pagesize - 1;
    }
  }

  get totalCount() {
    if (this.dataset.paginationContext) {
      return this.dataset.paginationContext.totalCount;
    }
  }

  pageClicked(pageno: number) {
    this.setCurrentPage({ pageno });
    if (this.dataset.paginationContext) {
      if (pageno === this.pageCount) {
        this.isCurrentMaxRow = false;
      } else {
        this.isCurrentMaxRow = true;
      }
    }
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
  cursor: not-allowed;
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
