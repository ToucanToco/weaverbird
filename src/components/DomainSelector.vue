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

<script>
export default {
  name: 'domain-selector',
  props: {
    domainsList: Array,
    selectedDomain: String,
  },
  methods: {
    isDomainSelected(name) {
      return this.selectedDomain === name;
    },
    select(newDomain) {
      this.$emit('selectedDomain', newDomain);
    },
  },
};
</script>

<style lang="scss" scoped>
  @import '../styles/DomainSelector';
</style>
