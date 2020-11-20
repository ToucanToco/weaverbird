<template>
  <div class="search-bar">
    <multiselect
      :options="actionOptions"
      label="label"
      track-by="label"
      :placeholder="'Search'"
      :reset-after="true"
      group-label="type"
      group-values="actions"
      :group-select="false"
      @select="actionClicked"
      open-direction="bottom"
    />
  </div>
</template>
<script lang="ts">
import Multiselect from 'vue-multiselect';
import { Component, Vue } from 'vue-property-decorator';

import { PipelineStepName } from '@/lib/steps';

import { VQBModule } from '../store';
import { SEARCH_ACTION } from './constants';

@Component({
  name: 'search-bar',
  components: {
    Multiselect,
  },
})
export default class SearchBar extends Vue {
  @VQBModule.Getter translator!: string;
  @VQBModule.Getter unsupportedSteps!: PipelineStepName[];

  get actionOptions() {
    return SEARCH_ACTION.map(e => ({
      ...e,
      actions: e.actions.filter(a => !this.unsupportedSteps.includes(a.name)),
    }));
  }

  actionClicked(actionName: { name: PipelineStepName }) {
    this.$emit('actionClicked', actionName.name);
  }
}
</script>
<style lang="scss">
@import '../styles/_variables';

.search-bar {
  color: #999999;
  align-self: center;
  margin-left: 10px;
  max-width: 160px;
  width: 100px;
}
.search-bar-icon {
  vertical-align: middle;
}
.search-bar .multiselect {
  box-sizing: border-box;
  border: 0;
  color: #999999;
  margin: 0;
}
.search-bar .multiselect__tags {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 5px;
  box-shadow: none;
  padding-left: 35px;
  padding-right: 20px;
  min-height: 43px;
  &:before {
    font-family: 'Font Awesome 5 Pro', 'Font Awesome 5 Free';
    content: '\f002';
    -webkit-font-smoothing: antialiased;
    display: inline-block;
    font-style: normal;
    font-variant: normal;
    text-rendering: auto;
    font-weight: 900;
    line-height: 1;
    font-size: 16px;
    color: #999999;
    position: absolute;
    left: 10px;
    display: block;
    top: 13px;
    width: 16px;
    height: 16px;
  }
}
.search-bar .multiselect--active .multiselect__tags {
  box-shadow: none;
  border-color: #2665a3;
}
.search-bar .multiselect__placeholder {
  padding: 0;
}
.search-bar .multiselect__select {
  display: none;
}
.search-bar .multiselect__input {
  font-size: 12px;
  line-height: 25px;
  padding: 0px;
  position: absolute;
}
.search-bar .multiselect__content-wrapper {
  border-radius: 5px;
  width: 200px;
  right: -20px;
  top: 44px;
  border: 0;
  box-shadow: 0px 1px 20px 0px rgba(0, 0, 0, 0.2);
}
.search-bar .multiselect__option {
  color: $base-color;
  font-size: 12px;
  padding: 10px 10px 10px 15px;
  box-shadow: none;
  min-height: 0;
  &:focus {
    outline: none;
  }
}
.search-bar .multiselect__option--group {
  background: none !important;
  color: $base-color !important;
  border-top: 1px solid #e0e0e0;
  font-weight: bold;
  box-shadow: none;
  min-height: 30px;
  padding-bottom: 0;
  padding-left: 12px;
  text-transform: capitalize;
}
.search-bar .multiselect__element:first-child .multiselect__option--group {
  border: 0;
}
</style>
