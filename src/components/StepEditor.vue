<template>
  <div>{{ formattedTitle }}</div>
</template>

<script lang="ts">
import _ from 'lodash';
import { Component, Prop, Vue } from 'vue-property-decorator';
import * as Schemas from '../assets/schemas';

export interface Schema {
  [propName: string]: any;
}

@Component({
  name: 'step-editor',
})
export default class StepEditor extends Vue {
  @Prop({
    default: () => '',
    type: String,
  })
  name!: string;

  schemas: Schema = Schemas;
  schema: Schema = {};

  get formattedTitle() {
    return `${_.capitalize(this.name)} step configuration`;
  }

  created() {
    if (this.name) {
      this.schema = this.schemas[`${this.name}StepSchema`];
    }
  }
}
</script>
