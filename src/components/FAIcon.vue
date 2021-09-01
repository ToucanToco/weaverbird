<template>
  <FontAwesomeIcon :icon="[styles, icon]" />
</template>

<script lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

/* This component enable to use a font-awesome icon in svg mode 
using only the icon name without prefix  and optionnaly the style(far or fas) */

@Component({
  name: 'FA-icon',
  components: {
    FontAwesomeIcon,
  },
})
export default class Icon extends Vue {
  @Prop({
    type: String,
    required: true,
  })
  icon!: string;

  @Prop({
    type: String,
    default: 'fas',
  })
  styles!: 'fas' | 'far'; //IMPORTANT: some icons are not available in far
}
</script>
