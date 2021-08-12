<template>
  <div class="tabs">
    <div ref="tabsContainer" class="tabs__tabs-container">
      <div
        v-for="tab in tabs"
        :key="tab"
        ref="tabs"
        class="tabs__tab"
        data-cy="weaverbird-tabs-tab"
        :class="{
          'tabs__tab--disabled': isTabDisabled(tab),
          'tabs__tab--selected': selectedTab === tab,
        }"
        @click="selectTab(tab)"
      >
        {{ formatTab(tab) }}
        <slot :tab="tab" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({
  name: 'tabs',
})
export default class Tabs extends Vue {
  @Prop({ default: () => [] })
  tabs!: string[];

  @Prop({ default: () => [] })
  disabledTabs!: string[];

  @Prop({ default: undefined })
  selectedTab!: string;

  @Prop({ default: () => (tab: string) => `${tab}` })
  formatTab!: Function;

  created() {
    // select first available tab if necessary
    const availableTabs = this.tabs.filter(t => this.disabledTabs.indexOf(t) === -1);
    const tabIsUnavailable =
      this.selectedTab == null || availableTabs.indexOf(this.selectedTab) === -1;
    if (tabIsUnavailable) this.selectTab(availableTabs[0]);
  }

  selectTab(tab: string): void {
    if (!this.isTabDisabled(tab)) {
      this.$emit('tabSelected', tab);
    }
  }

  isTabDisabled(tab: string): boolean {
    return this.disabledTabs.indexOf(tab) !== -1;
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/_variables';
$grey: #eeedf0;
$grey-dark: #6a6a6a;

.tabs {
  display: flex;
  flex-grow: 1;
  border-bottom: 1px solid $grey;
}

.tabs__tabs-container {
  display: flex;
  align-items: flex-end;
  flex-grow: 1;
  overflow: hidden;
  position: relative;
}

.tabs__tab {
  font-size: 12px;
  color: $grey-dark;
  text-transform: uppercase;
  font-weight: 700;
  padding: 5px 10px;
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  font-family: 'Montserrat', sans-serif;
}

.tabs__tab:hover {
  color: $active-color;
  text-decoration: none;
}

.tabs__tab--selected {
  text-decoration: none;
  color: $active-color;
  border-bottom: 3px solid $active-color;
  margin-bottom: -2px; // To avoid having the border above the border of the container
  padding-bottom: 4px; // To avoid the label "jumping" one pixel up when selected
}

.tabs__tab--disabled {
  border-bottom-color: $grey;
  cursor: not-allowed;
  &,
  &:hover {
    background: unset;
    color: rgba($grey, 0.9);
  }
}
</style>
