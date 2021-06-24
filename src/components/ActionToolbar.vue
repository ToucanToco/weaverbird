<template>
  <div class="action-toolbar__container">
    <div class="action-toolbar">
      <template v-if="hasSupportedButtons">
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
        <action-toolbar-search
          :is-active="isActionToolbarSearchOpened"
          @actionClicked="actionClicked"
          @click.native.stop="openPopover(actionToolbarSearchIndex)"
          @closed="closePopover()"
        />
      </template>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import { PipelineStepName } from '@/lib/steps';
import { VQBModule } from '@/store';

import ActionToolbarButton from './ActionToolbarButton.vue';
import ActionToolbarSearch from './ActionToolbarSearch.vue';
import { ACTION_CATEGORIES, ButtonDef, CATEGORY_BUTTONS } from './constants';

@Component({
  name: 'action-toolbar',
  components: {
    ActionToolbarButton,
    ActionToolbarSearch,
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

  get hasSupportedButtons(): boolean {
    return this.supportedButtons.length > 0;
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

  get actionToolbarSearchIndex() {
    return this.formattedButtons.length;
  }

  get isActionToolbarSearchOpened() {
    return this.isActiveActionToolbarButton === this.actionToolbarSearchIndex;
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
