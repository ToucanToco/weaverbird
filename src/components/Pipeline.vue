<template>
  <div class="query-pipeline">
    <Step v-for="(step, index) in steps" :key="index"
          :isActive="isSelected(index)"
          :isFirst="index === 0"
          :isLast="index === steps.length - 1"
          :step="step"
          @selected="selectStep(index)"
    />
  </div>
</template>
<script>
import Step from './Step';

export default {
  name: 'pipeline',
  components: {
    Step
  },
  props: {
    steps: Array
  },
  data() {
    return {
      selectedStep: this.steps.length - 1
    }
  },
  methods: {
    isSelected(index) {
      return this.selectedStep === index;
    },
    selectStep(index) {
      this.selectedStep = index;
    }
  },
}
</script>
<style scoped>

  .query-pipeline {
    height: 100%;
  }

</style>
