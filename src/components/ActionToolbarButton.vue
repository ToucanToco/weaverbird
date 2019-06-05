<template>
  <button type="button" class="action-toolbar__btn">
    <i :class="`action-toolbar__btn-icon fas fa-${icon}`"></i>
    <span class="action-toolbar__btn-txt">{{ label }}</span>
    <popover :active="isActive" :align="alignLeft" bottom>
      <div class="action-menu__body">
        <div class="action-menu__section">
          <div class="action-menu__option">test item 1</div>
          <div class="action-menu__option">test item 2</div>
          <div class="action-menu__option">test item 3</div>
        </div>
      </div>
    </popover>
  </button>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { POPOVER_ALIGN } from '@/components/constants';
import Popover from './Popover.vue';

@Component({
  name: 'action-toolbar-button',
  components: {
    Popover,
  },
  props: {
    label: String,
    icon: String,
  },
})
export default class ActionToolbarButton extends Vue {
  @Prop({
    type: Boolean,
    default: () => false,
  })
  isActive!: boolean;

  alignLeft: string = POPOVER_ALIGN.LEFT;

  /**
   * @description Close the popover when clicking outside
   */
  clickListener(e: Event) {
    const hasClickOnItSelf = e.target === this.$el || this.$el.contains(e.target as HTMLElement);

    if (!hasClickOnItSelf) {
      this.close();
    }
  }

  close() {
    this.$emit('closed');
  }

  @Watch('isActive')
  onIsActiveChanged(val: boolean, oldval: boolean) {
    if (val) {
      window.addEventListener('click', this.clickListener);
    } else {
      window.removeEventListener('click', this.clickListener);
    }
  }
}
</script>
<style lang="scss">
.action-toolbar__btn {
  background: #fafafa;
  border-radius: 5px;
  border: 1px solid #fafafa;
  color: #2a66a1;
  padding: 10px 0;
  text-align: center;
  margin-left: 5px;
  width: 75px;
  &:focus {
    outline: none;
  }
}

.action-toolbar__btn--special {
  background: none;
  border: 1px dashed #999999;
  color: #999999;
  margin-left: 0;
}

.action-toolbar__btn-icon {
  font-size: 18px;
  margin-bottom: 6px;
}

.action-toolbar__btn-icon--reshape {
  background: url(../assets/reshape-icon.png) no-repeat;
  display: inline-block;
  width: 16px;
  height: 15px;
}

.action-toolbar__btn-txt {
  display: block;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
}
</style>
