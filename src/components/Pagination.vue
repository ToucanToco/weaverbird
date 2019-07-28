<template>
  <div class="pagination">
    <paginate
      :page-count="pageCount"
      containerClass="pagination__list"
      prev-class="prevnext"
      next-class="prevnext"
      :clickHandler="pageClicked"
    />
  </div>
</template>

<script lang="ts">
import Paginate from 'vuejs-paginate';
import { Vue, Component } from 'vue-property-decorator';
import { Mutation, State } from 'vuex-class';
import { DataSet } from '@/lib/dataset';
import { numberOfPages } from '@/lib/dataset/pagination';
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

  get pageCount() {
    if (this.dataset.paginationContext) {
      return numberOfPages(this.dataset.paginationContext);
    }
    return 1;
  }

  pageClicked(pageno: number) {
    this.setCurrentPage({ pageno });
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
</style>
