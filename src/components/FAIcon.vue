<template>
  <FontAwesomeIcon :icon="[styles, icon]" />
</template>

<script lang="ts">
import { library } from '@fortawesome/fontawesome-svg-core';
import { far } from '@fortawesome/free-regular-svg-icons'; // TODO: find a better way that including all icons
import { fas } from '@fortawesome/free-solid-svg-icons'; // TODO: find a better way that including all icons
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

library.add(fas, far);

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
