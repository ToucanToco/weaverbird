<template>
  <div class="domain-selector">
    <label class="domain-selector__label" for="domain">DOMAIN</label>
    <div class="domain-selector__select-container">
      <select id="domain" @input="updateDomain()">
        <option
          v-for="(domain, index) in domainsList"
          :key="index"
          :selected="isDomainSelected(domain)"
        >{{ domain }}</option>
      </select>
      <i class="fas fa-angle-down domain-selector__icon-arrow"></i>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'
import { Mutation, State } from 'vuex-class';
import { VQBState } from '@/store/state';

@Component({
  name: 'domain-selector'
})
export default class DomainSelector extends Vue {
  @State('domains') domainsList!: Array<String>;

  @Prop()
  readonly selectedDomain!: string | undefined

  @Mutation setCurrentDomain!: (payload: Pick<VQBState, 'currentDomain'>) => void;

  isDomainSelected(name: string) {
    return this.selectedDomain === name;
  }

  updateDomain(currentDomain: string) {
    this.setCurrentDomain({ currentDomain });
  }

}
</script>

<style lang="scss" scoped>
@import '../styles/DomainSelector';
</style>
