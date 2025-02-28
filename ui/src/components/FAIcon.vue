<template>
  <FontAwesomeIcon :icon="iconWithStyle" />
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

import type { FAIconName } from '@/assets/FA-ICONS';

/* This component enable to use a font-awesome icon in svg mode (available icons are declared in @/assets/FA-ICONS)  */

export default defineComponent({
  name: 'FA-icon',

  components: {
    FontAwesomeIcon,
  },

  props: {
    icon: {
      type: String as PropType<FAIconName>,
      default: '',
    },
  },

  computed: {
    iconWithStyle(): FAIconName | string[] {
      const hasSpecificStyle = this.icon.indexOf(' ') != -1; // icon name is prefixed
      if (hasSpecificStyle) {
        return this.icon.split(' ');
      } else {
        return this.icon;
      }
    },
  },
});
</script>
