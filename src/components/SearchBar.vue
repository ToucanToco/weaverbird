<template>
  <div class="search-bar">
    <multiselect
      v-model="editedValue"
      :options="actionOptions"
      label="label"
      track-by="label"
      :placeholder="'Search'"
      :reset-after="true"
      @select="actionClicked"
    ></multiselect>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { ActionCategory, SEARCH_ACTION, ACTION_CATEGORIES } from './constants';
import Multiselect from 'vue-multiselect';

@Component({
  name: 'search-bar',
  components: {
    Multiselect,
  },
})
export default class SearchBar extends Vue {
  actionOptions: ActionCategory[] = SEARCH_ACTION;
  editedValue: string[] = [];

  @Watch('value', { immediate: true })
  updateEditedValue(newValue: string[]) {
    this.editedValue = newValue;
  }

  @Watch('editedValue')
  updateValue(newValue: string[]) {
    this.$emit('input', newValue);
  }

  actionClicked(actionName: { name: string }) {
    this.$emit('actionClicked', actionName.name);
  }
}
</script>
<style lang="scss">
@import '../styles/_variables';

.search-bar {
  background: #fafafa;
  border-radius: 5px;
  border: 1px solid #f0f0f0;
  color: #999999;
  align-self: center;
  margin-left: 10px;
  max-width: 160px;
  width: 160px;
}
.search-bar-icon {
  vertical-align: middle;
}
.search-bar .multiselect {
  box-sizing: border-box;
  border: 0;
  color: #999999;
  // line-height: 25px;
  min-height: 25px;
  margin: 3px 0;
}
.search-bar .multiselect__tags {
  box-shadow: none;
  padding-left: 35px;
  &:before {
    font-family: 'Font Awesome 5 Free';
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
.search-bar .multiselect__select {
  display: none;
}
.search-bar .multiselect__content-wrapper {
  border-radius: 5px;
  width: 200px;
  right: -20px;
  top: 44px;
  border: 0;
  box-shadow: 0px 1px 20px 0px rgba(0, 0, 0, 0.2);
}

.multiselect__option {
  color: $base-color;
  font-size: 12px;
}

.search-bar-input:focus {
  outline: none;
}
</style>
