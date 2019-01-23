<template>
  <div>
    <Step v-for="(step, index) in steps" :key="index"
          :isFirst="index === 0"
          :isLast="index === steps.length - 1"
          :step="step"
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
}
</script>
<style scoped></style>
