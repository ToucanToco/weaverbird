<template>
  <DatePicker :value="value" :is-range="isRange" timeformat="UTC" @input="onInput" />
</template>

<script lang="ts">
import DatePicker from 'v-calendar/lib/components/date-picker.umd';
import { Component, Prop, Vue } from 'vue-property-decorator';

import { DateRange } from '@/lib/dates';

@Component({
  name: 'calendar',
  components: {
    DatePicker,
  },
})
export default class Calendar extends Vue {
  @Prop({ default: undefined })
  value!: Date | DateRange | undefined;

  @Prop({ default: false })
  isRange!: boolean;

  onInput(value: Date | DateRange | undefined): void {
    this.$emit('input', value);
  }
}
</script>
