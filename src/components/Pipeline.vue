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
      :is-active="index === selectedIndex"
      :is-disabled="isDisabled(index)"
      :is-first="index === 0"
      :is-last="index === stepsWithoutDomain.length - 1"
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
      selectedStep: -1,
      activePipeline: [],
      disabledPipeline: [],
    };
  },
  computed: {
    selectedIndex() {
      if (this.selectedStep < 0) {
        return this.stepsWithoutDomain.length -1;
      }

      return this.selectedStep;
    },
    isEmpty() {
      return this.stepsWithoutDomain.length === 0;
    },
    stepDomain() {
      return this.steps[0];
    },
    stepsWithoutDomain() {
      return this.steps.slice(1).concat(this.disabledPipeline);
    },
  },
  methods: {
    isDisabled(index) {
      if (this.selectedStep < 0) {
        return false;
      }
      return index > this.selectedStep;
    },
    selectStep(index) {
      let pipeline = [];
      this.selectedStep = index;

      this.activePipeline = this.stepsWithoutDomain.slice(0, this.selectedStep + 1);

      // Separate steps that are after the selected one to keep in memory
      this.disabledPipeline = this.stepsWithoutDomain.slice(this.selectedStep + 1, this.stepsWithoutDomain.length);

      // We emit the active pipeline with the step 0 (select domain) to the parent
      this.$emit('selectedPipeline', pipeline.concat(this.stepDomain, this.activePipeline));
    },
    resetSelectedStep() {
      this.selectedStep = -1;
    },
    updateDomain(newDomain) {
      return newDomain; // Emit an event
    },
  },
  watch: {
    steps() {
      this.resetSelectedStep();
    }
  }
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
