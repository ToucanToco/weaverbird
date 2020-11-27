<template>
  <div class="action-toolbar__container">
    <div class="action-toolbar">
      <action-toolbar-button
        v-for="(button, index) in formattedButtons"
        :icon="button.icon"
        :label="button.label"
        :key="button.icon"
        :category="button.category"
        :is-active="button.isActionToolbarMenuOpened"
        :class="button.class"
        @actionClicked="actionClicked"
        @click.native.stop="openPopover(index)"
        @closed="closePopover()"
      />
      <search-bar @actionClicked="actionClicked" />
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import { PipelineStepName } from '../lib/steps';
import { VQBModule } from '../store';
import ActionToolbarButton from './ActionToolbarButton.vue';
import { ACTION_CATEGORIES, ButtonDef, CATEGORY_BUTTONS } from './constants';
import SearchBar from './SearchBar.vue';

@Component({
  name: 'action-toolbar',
  components: {
    ActionToolbarButton,
    SearchBar,
  },
})
export default class ActionToolbar extends Vue {
  @VQBModule.State selectedColumns!: string[];
  @VQBModule.Getter unsupportedSteps!: PipelineStepName[];

  isActiveActionToolbarButton = -1;

  actionClicked(stepName: PipelineStepName, defaults = {}) {
    this.$emit('actionClicked', stepName, defaults);
  }

  openPopover(index: number) {
    this.isActiveActionToolbarButton = index;
  }

  // Filter buttons that contains at least one supported step
  get supportedButtons(): ButtonDef[] {
    return CATEGORY_BUTTONS.filter(categoryButton =>
      ACTION_CATEGORIES[categoryButton.category].some(
        action => !this.unsupportedSteps.includes(action.name),
      ),
    );
  }

  get formattedButtons() {
    return this.supportedButtons.map((d, index) => {
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
</style>
