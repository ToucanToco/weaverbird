<template>
  <FontAwesomeIcon :icon="iconWithStyle" />
</template>

<script lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

import { FAIconName } from '@/assets/FA-ICONS';

/* This component enable to use a font-awesome icon in svg mode (available icons are declared in @/assets/FA-ICONS)  */

@Component({
  name: 'FA-icon',
  components: {
    FontAwesomeIcon,
  },
})
export default class FAIcon extends Vue {
  @Prop({
    type: String,
    default: '',
  })
  icon!: FAIconName;

  get iconWithStyle(): FAIconName | string[] {
    const hasSpecificStyle = this.icon.indexOf(' ') != -1; // icon name is prefixed
    if (hasSpecificStyle) {
      return this.icon.split(' ');
    } else {
      return this.icon;
    }
  }
}
</script>
