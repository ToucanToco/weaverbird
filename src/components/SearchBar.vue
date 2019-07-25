<template>
  <div class="search-bar">
    <multiselect
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

  actionClicked(actionName: { name: string }) {
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
  width: 160px;
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
  min-height: 43px;
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
  &:focus {
    outline: none;
  }
}
</style>
