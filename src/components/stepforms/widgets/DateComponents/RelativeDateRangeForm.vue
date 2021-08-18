<template>
  <div class="widget-relative-date-range-form">
    <AutocompleteWidget />
    <RelativeDateForm />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';

import RelativeDateForm from './RelativeDateForm.vue';
/**
 * This component return a relative date range between a date variable and a relative date returned by RelativeDateForm
 */
@Component({
  name: 'relative-date-range-form',
  components: {
    RelativeDateForm,
    AutocompleteWidget,
  },
})
export default class RelativeDateRangeForm extends Vue {}
</script>

<style scoped lang="scss"></style>
