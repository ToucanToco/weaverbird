<template>
  <!-- No changes to template section -->
</template>

<script>
import { PropType } from 'vue';

export default {
  props: {
    initialStepValue: {
      type: Object as PropType<SelectStep>,
      default: (): SelectStep => ({
        name: 'select',
        columns: [],
      }),
    },
  },
};
</script>

<style>
/* No changes to style section */
</style>
