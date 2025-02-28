<template>
  <div v-resizable aria-hidden="true">
    Resizable directive should not work with something else than a table
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

import resizable from '@/directives/resizable/resizable';

export default defineComponent({
  name: 'FakeOtherComponent',
  
  directives: {
    resizable,
  }
});
</script>
