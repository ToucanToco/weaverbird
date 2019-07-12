<template>
  <div class="action-toolbar__search">
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
