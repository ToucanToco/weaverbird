<template>
  <div class="action-toolbar__container">
    <div class="action-toolbar">
      <button
        type="button"
        class="action-toolbar__btn action-toolbar__btn--special"
        @click="actionClicked('formula')"
      >
        <i class="action-toolbar__btn-icon fas fa-plus"></i>
        <span class="action-toolbar__btn-txt">Column</span>
      </button>
      <action-toolbar-button
        v-for="(button, index) in formattedButtons"
        :icon="button.icon"
        :label="button.label"
        :key="button.icon"
        :category="button.category"
        :is-active="button.isActionToolbarMenuOpened"
        :class="button.class"
        @actionClicked="actionClicked"
        @click.native="openPopover(index)"
        @closed="closePopover()"
      />
      <search-bar @actionClicked="actionClicked"></search-bar>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import { State } from 'vuex-class';
import ActionToolbarButton from './ActionToolbarButton.vue';
import { ButtonDef } from './constants';
import { PipelineStepName } from '@/lib/steps';
import SearchBar from './SearchBar.vue';

@Component({
  name: 'action-toolbar',
  components: {
    ActionToolbarButton,
    SearchBar,
  },
})
export default class ActionToolbar extends Vue {
  @Prop(Array) readonly buttons!: ButtonDef[];
  @State selectedColumns!: string[];

  isActiveActionToolbarButton: number = -1;

  actionClicked(stepName: PipelineStepName) {
    this.$emit('actionClicked', stepName);
  }

  openPopover(index: number) {
    const buttondef = this.buttons[index];
    this.isActiveActionToolbarButton = index;
    if (buttondef.label === 'Aggregate') {
      this.actionClicked('aggregate');
    }
  }

  get formattedButtons() {
    return this.buttons.map((d, index) => {
      let isActionToolbarMenuOpened = false;

      if (index === this.isActiveActionToolbarButton) {
        isActionToolbarMenuOpened = true;
      }

      return {
        ...d,
        class: {
          'action-toolbar__btn--active': isActionToolbarMenuOpened,
          'action-toolbar__btn--disable': !d.enable,
        },
        isActionToolbarMenuOpened,
      };
    });
  }

  closePopover() {
    this.isActiveActionToolbarButton = -1;
  }
}
</script>
<style lang="scss">
.action-toolbar {
  display: flex;
  margin-bottom: 15px;
  margin-right: 15px;
  justify-content: space-between;
}

.action-toolbar__search {
  background: #fafafa;
  border-radius: 5px;
  border: 1px solid #f0f0f0;
  color: #999999;
  padding-left: 5px;
  align-self: center;
  margin-left: 10px;
}

.action-toolbar__search-icon {
  vertical-align: middle;
}

.action-toolbar__search-input {
  background: none;
  border: 0;
  color: #999999;
  line-height: 25px;
  margin: 3px 0 3px 5px;
  &:focus {
    outline: none;
  }
}
</style>
