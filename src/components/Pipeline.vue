<template>
  <ul>
    <div v-for="(step, index) in steps" :key="index">
        <Step :step="step" :isFirst="index === 0" :isLast="index === steps.length - 1"/>
    </div>
  </ul>
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
