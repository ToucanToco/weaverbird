<template>
  <div class="action-toolbar-search">
    <button type="button" class="action-toolbar-search__btn">
      <i class="action-toolbar-search__btn-icon fa fa-search" aria-hidden="true" />
      <popover :visible="isActive" :align="'left'" bottom @closed="$emit('closed')">
        <div class="action-menu__body">
          Todo : add multiselect here
        </div>
      </popover>
    </button>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import Popover from './Popover.vue';

@Component({
  name: 'action-toolbar-search',
  components: {
    Popover,
  },
})
export default class SearchActions extends Vue {
  @Prop({
    type: Boolean,
    default: () => false,
  })
  isActive!: boolean;
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
</style>
