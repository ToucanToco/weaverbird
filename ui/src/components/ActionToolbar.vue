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
import { defineComponent } from 'vue';
import { mapGetters, mapState } from 'pinia';

import type { PipelineStepName } from '@/lib/steps';
import { VQBModule } from '@/store';

import ActionToolbarButton from './ActionToolbarButton.vue';
import ActionToolbarSearch from './ActionToolbarSearch.vue';
import type { ButtonDef } from './constants';
import { CATEGORY_BUTTONS } from './constants';

export default defineComponent({
  name: 'action-toolbar',

  components: {
    ActionToolbarButton,
    ActionToolbarSearch,
  },

  data() {
    return {
      isActiveActionToolbarButton: -1,
    };
  },

  computed: {
    ...mapState(VQBModule, ['selectedColumns', 'featureFlags']),

    ...mapGetters(VQBModule, ['unsupportedSteps']),

    hasSupportedButtons(): boolean {
      return this.supportedButtons.length > 0;
    },

    // Enable to develop steps under feature flag
    featureFlagsAllowedButtons(): ButtonDef[] {
      return CATEGORY_BUTTONS.filter((d) => {
        if (!d.featureFlag) {
          return !!d.enable;
        } else {
          return !this.featureFlags ? false : this.featureFlags[d.featureFlag] === 'enable';
        }
      });
    },

    // Filter buttons that contains at least one supported step
    supportedButtons(): ButtonDef[] {
      return this.featureFlagsAllowedButtons;
    },

    formattedButtons() {
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
    },

    actionToolbarSearchIndex() {
      return this.formattedButtons.length;
    },

    isActionToolbarSearchOpened() {
      return this.isActiveActionToolbarButton === this.actionToolbarSearchIndex;
    },
  },

  methods: {
    actionClicked(stepName: PipelineStepName, defaults = {}) {
      this.$emit('actionClicked', stepName, defaults);
    },

    openPopover(index: number) {
      this.isActiveActionToolbarButton = index;
    },

    closePopover() {
      this.isActiveActionToolbarButton = -1;
    },
  },
});
</script>
<style lang="scss">
.action-toolbar {
  display: flex;
  margin-bottom: 15px;
  margin-right: 15px;
  justify-content: space-between;
}
</style>
