<template>
  <div class="domain-selector">
    <label class="domain-selector__label" for="domain">
      DOMAIN
    </label>
    <div class="domain-selector__select-container">
      <select id="domain" @input="select()">
        <option v-for="(domain, index) in domainsList"
          :key="index"
          :selected="isDomainSelected(domain)">
            {{ domain }}
        </option>
      </select>
      <i class="fas fa-angle-down domain-selector__icon-arrow"></i>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Prop } from 'vue-property-decorator'

@Component({
  name: 'domain-selector'
})
export default class DomainSelector extends Vue {
  @Prop({
    default: () => [],
    type: Array
  })
  readonly domainsList!: Array<string>

  @Prop()
  readonly selectedDomain!: string | undefined

  isDomainSelected(name: string) {
    return this.selectedDomain === name;
  }

  select(newDomain: string) {
    this.$emit('selectedDomain', newDomain);
  }
}
</script>

<style lang="scss" scoped>
  @import '../styles/DomainSelector';
</style>
