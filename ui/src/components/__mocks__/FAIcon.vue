<template>
  <div>
    <div class="fa-icon" :icon="icon" />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { FAIconName } from '@/assets/FA-ICONS';

export default defineComponent({
  name: 'FA-icon',

  props: {
    icon: {
      type: String as PropType<FAIconName>,
      default: '',
    },
  },
});
</script>
