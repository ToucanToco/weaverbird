<template>
  <div class="action-toolbar-search">
    <button type="button" class="action-toolbar-search__btn">
      <i class="action-toolbar-search__btn-icon fa fa-search" aria-hidden="true" />
      <popover :visible="isActive" :align="'left'" bottom @closed="$emit('closed')">
        <div class="action-menu__body">
          <multiselect
            ref="searchComponent"
            :options="actionOptions"
            label="label"
            track-by="label"
            :placeholder="'Search'"
            :reset-after="true"
            group-label="type"
            group-values="actions"
            :group-select="false"
            open-direction="bottom"
          />
        </div>
      </popover>
    </button>
  </div>
</template>
<script lang="ts">
import Multiselect from 'vue-multiselect';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

import { VQBModule } from '../store';
import { SEARCH_ACTION } from './constants';
import Popover from './Popover.vue';

@Component({
  name: 'action-toolbar-search',
  components: {
    Popover,
    Multiselect,
  },
})
export default class SearchActions extends Vue {
  @VQBModule.Getter translator!: string;
  @VQBModule.Getter unsupportedSteps!: PipelineStepName[];

  @Prop({
    type: Boolean,
    default: () => false,
  })
  isActive!: boolean;

  @Watch('isActive')
  async onIsActiveChanged() {
    if (this.isActive) {
      await this.$nextTick();
      this.focusSearchBar();
    }
  }

  get actionOptions() {
    return SEARCH_ACTION.map(e => ({
      ...e,
      actions: e.actions.filter(a => !this.unsupportedSteps.includes(a.name)),
    }));
  }

  mounted() {
    if (this.isActive) {
      this.focusSearchBar();
    }
  }

  focusSearchBar() {
    this.$refs.searchComponent?.$el.focus();
  }
}
</script>
<style lang="scss">
@import '../styles/_variables';

.action-toolbar-search__btn {
  background: #fafafa;
  border-radius: 5px;
  border: 1px solid #fafafa;
  color: #878787;
  padding: 10px 0;
  text-align: center;
  width: 48px;
  height: 100%;
  transition: all ease-in-out 100ms;
  cursor: pointer;
  &:focus {
    outline: none;
  }
  &:hover {
    background: #f4f7fa;
    color: $active-color;
  }
}

.action-toolbar-search__btn-icon {
  font-size: 18px;
}

.action-menu__body {
  min-height: 300px;
}
</style>
