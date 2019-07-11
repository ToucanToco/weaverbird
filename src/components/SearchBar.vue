<template>
  <div class="action-toolbar__search">
    <i class="action-toolbar__search-icon fas fa-search"></i>
    <input
      @keyup="openSearch($event.target.value)"
      class="action-toolbar__search-input"
      type="text"
      placeholder="Search"
    />
    <popover :active="isActive" bottom>
      <div class="action-menu__body">
        <div class="action-menu__section">
          <div
            v-for="(item, index) in actionItems"
            :key="index"
            class="action-menu__option"
            @click="actionClicked(item.name)"
          >{{ item.label }}</div>
        </div>
      </div>
    </popover>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { ActionCategory, SEARCH_ACTION } from './constants';
import { PipelineStepName } from '@/lib/steps';
import Popover from './Popover.vue';

@Component({
  name: 'search-bar',
  components: {
    Popover,
  },
})
export default class SearchBar extends Vue {
  isActive: boolean = false;
  filteredItems: ActionCategory[] = [];

  get actionItems() {
    return this.filteredItems.sort(function(a, b) {
      return a.label.localeCompare(b.label);
    });
  }

  actionClicked(stepName: PipelineStepName) {
    this.$emit('actionClicked', stepName);
  }

  openSearch(value: string) {
    if (value.length > 1) {
      this.isActive = true;
      this.filteredItems = SEARCH_ACTION.filter(d => {
        return d.label.toLowerCase().indexOf(value.toLowerCase()) > -1;
      });
    }
  }
}
</script>
