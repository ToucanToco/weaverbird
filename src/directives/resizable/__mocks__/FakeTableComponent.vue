<template>
  <table v-resizable>
    <thead>
      <tr>
        <th>Col 1</th>
        <th>Col 2</th>
        <th>Col 3</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>2</td>
        <td>3</td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import resizable from '@/directives/resizable/resizable';
@Component({
  name: 'FakeTableComponent',
  directives: {
    resizable,
  },
})
export default class FakeTableComponent extends Vue {}
</script>
