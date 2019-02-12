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
    selectedDomain: String
  },
  methods: {
    isDomainSelected(name) {
      return this.selectedDomain === name;
    },
    select(newDomain) {
      this.$emit('selectedDomain', newDomain);
    },
  }

}
</script>

<style scoped>
  .domain-selector {
    border-bottom: 1px solid rgba(239, 239, 239);
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding-bottom: 20px;
    width: 100%;
  }

  .domain-selector__label {
    color: rgb(154, 154, 154);
    font-weight: 600;
    font-size: 12px;
    margin-right: 10px;
  }

  .domain-selector__select-container {
    position: relative;
    width: 100%;
    height: 40px;
    background-color: rgba(239, 239, 239);
    overflow: hidden;
  }


  .domain-selector__select-container select {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;

    color: rgb(154, 154, 154);
    font-weight: 600;
    font-size: 15px;

    width: 110%;

    height: 100%;
    outline: none;
    border: 0;
    margin: 0;
    padding: .75em;
    border-radius: 0;

    overflow: hidden;
    text-overflow: ellipsis;
  }

  .domain-selector__icon-arrow {
    color: black;
    position: absolute;
    top: 50%;
    margin-top: -8px;
    right: 10px;
  }

</style>

