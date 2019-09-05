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
        @click.native="openPopover(index)"
        @closed="closePopover()"
      />
      <search-bar @actionClicked="actionClicked"></search-bar>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from 'vue';
import { VQBModule } from '@/store';
import { Component, Prop } from 'vue-property-decorator';
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
  @VQBModule.State selectedColumns!: string[];

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
</style>
