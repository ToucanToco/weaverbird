<template>
  <div class="widget-relative-date-form" />
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import { VariablesBucket } from '@/lib/variables';
/**
 * This component return a relative date composed from a number and a "period" variable
 */
@Component({
  name: 'relative-date-form',
  components: {},
})
export default class CustomVariableList extends Vue {
  @Prop({ default: () => [] })
  availableVariables!: VariablesBucket;
}
</script>

<style scoped lang="scss">
@import '../../../../styles/variables';
</style>
