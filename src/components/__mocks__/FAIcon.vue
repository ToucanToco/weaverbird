<script lang="ts">
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';

import { FAIconName } from '@/assets/FA-ICONS';

@Component({
  name: 'FA-icon',
})
export default class FAIcon extends Vue {
  @Prop({
    type: String,
    default: '',
  })
  icon!: FAIconName;
}
</script>

<template>
  <div>
    <div class="fa-icon" :icon="icon" />
  </div>
</template>
