<template>
  <popover :active="isActive" :align="alignLeft" bottom>
    <div class="action-menu__body">
      <div class="action-menu__section">
        <div class="action-menu__option">Duplicate column</div>
        <div class="action-menu__option" @click="createRenameStep">Rename column</div>
        <div class="action-menu__option">Delete column</div>
        <div class="action-menu__option" @click="createFillnaStep">Fill null values</div>
      </div>
    </div>
  </popover>
</template>
<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import { POPOVER_ALIGN } from '@/components/constants';
import Popover from './Popover.vue';

@Component({
  name: 'action-menu',
  components: {
    Popover,
  },
})
export default class ActionMenu extends Vue {
  @Prop({
    type: Boolean,
    default: () => false,
  })
  isActive!: boolean;

  @Prop({
    type: String,
    default: () => '',
  })
  columnName!: string;

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

  createFillnaStep() {
    this.$emit('actionClicked', { name: 'fillna', column: this.columnName });
    this.close();
  }

  createRenameStep() {
    this.$emit('actionClicked', { name: 'rename', oldname: this.columnName });
    this.close();
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
@import '../styles/_variables';

.action-menu__body {
  display: flex;
  flex-direction: column;
  border-radius: 3px;
  margin-left: -5px;
  margin-right: -5px;
  width: 200px;
  background-color: #fff;
  box-shadow: 0px 1px 20px 0px rgba(0, 0, 0, 0.2);
}

.action-menu__section {
  display: flex;
  flex-direction: column;
  border-color: $data-viewer-border-color;

  &:not(:last-child) {
    border-bottom-style: solid;
    border-bottom-width: 1px;
  }
}

.action-menu__option {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 13px;
  padding: 10px 12px;
  line-height: 20px;
  justify-content: space-between;
  position: relative;

  &:hover {
    background-color: rgba(0, 0, 0, 0.03);
  }

  &:last-child {
    margin-bottom: 0;
  }
}
</style>
