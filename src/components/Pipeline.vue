<template>
  <ul>
    <li v-for="(step, index) in steps" :key="index">
        {{ step.name }} - {{ step.query }}
    </li>
  </ul>
</template>
<script>
export default {
  name: 'Pipeline',
  props: {
    steps: Array
  }
}
</script>
<style scoped></style>
