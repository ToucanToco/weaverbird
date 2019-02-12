<template>
  <div class="query-pipeline">
    <DomainSelector :domains-list="domainsList" :selected-domain="selectedDomain" @selectedDomain="updateDomain"/>
    <Step v-for="(step, index) in stepsWithoutDomain" :key="index"
          :isActive="isStepSelected(index)"
          :isFirst="index === 0"
          :isLast="index === stepsWithoutDomain.length - 1"
          :step="step"
          @selectedStep="selectStep(index)"
    />
  </div>
</template>
<script>
import _ from 'lodash';
import DomainSelector from './DomainSelector'
import Step from './Step';

export default {
  name: 'pipeline',
  components: {
    DomainSelector,
    Step
  },
  props: {
    steps: Array,
    domainsList: Array,
  },
  data() {
    return {
      selectedStep: this.steps.length - 2
    }
  },
  computed: {
    selectedDomain() {
      return this.steps[0].domain;
    },
    stepsWithoutDomain() {
      return _.tail(this.steps);
    },
  },
  methods: {
    isStepSelected(index) {
      return this.selectedStep === index;
    },
    selectStep(index) {
      this.selectedStep = index;
    },
    updateDomain(newDomain) {
      return newDomain; // Emit an event
    },
  },
}
</script>
<style scoped>

  .query-pipeline {
    height: 100%;
  }

</style>
