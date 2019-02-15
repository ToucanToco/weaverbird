<template>
  <div class="query-pipeline">
    <DomainSelector
      :domains-list="domainsList"
      :selected-domain="stepDomain.domain"
      @selectedDomain="updateDomain"
    />
    <div v-if="isEmpty" class="query-pipeline__empty-container">
      <div class="query-pipeline__empty-message">
          Start playing with data right from the table opposite or switch to Code View with
          <i class="fas fa-code"></i> !
      </div>
      <i class="fas fa-magic"></i>
    </div>
    <Step
      v-else
      v-for="(step, index) in stepsWithoutDomain"
      :key="index"
      :isActive="isStepSelected(index)"
      :isFirst="index === 0"
      :isLast="index === stepsWithoutDomain.length - 1"
      :step="step"
      @selectedStep="selectStep(index)"
    />
  </div>
</template>
<script>
import DomainSelector from './DomainSelector.vue';
import Step from './Step.vue';

export default {
  name: 'pipeline',
  components: {
    DomainSelector,
    Step,
  },
  props: {
    steps: Array,
    domainsList: Array,
  },
  data() {
    return {
      selectedStep: this.steps.length - 2,
    };
  },
  computed: {
    isEmpty() {
      return this.stepsWithoutDomain.length === 0;
    },
    stepDomain() {
      return this.steps[0];
    },
    stepsWithoutDomain() {
      return this.steps.slice(1);
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
};
</script>
<style scoped>
.query-pipeline {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.query-pipeline__empty-container {
  width: 60%;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-weight: lighter;
}

.query-pipeline__empty-message {
  font-size: 24px;
  color: rgb(154, 154, 154);
  margin-top: 120px;
  margin-bottom: 170px;
  text-align: center;
}

.fa-code {
  color: rgba(239, 239, 239);
}

.fa-magic {
  color: rgba(239, 239, 239);
  font-size: 64px;
}
</style>
