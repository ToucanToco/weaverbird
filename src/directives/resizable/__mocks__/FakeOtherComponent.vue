<template>
  <div v-resizable>
    Resizable directive should not work with something else than a table
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import resizable from '@/directives/resizable/resizable';
@Component({
  name: 'FakeOtherComponent',
  directives: {
    resizable,
  },
})
export default class FakeOtherComponent extends Vue {}
</script>
