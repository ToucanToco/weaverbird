<template>
  <div class="condition-form">
    <input
      :value="condition.column"
      class="condition-form__input condition-form__input--column"
      @input="updateInput('column', $event.target.value)"
    >
    <input
      :value="condition.comparison"
      class="condition-form__input condition-form__input--comparison"
      @input="updateInput('comparison', $event.target.value)"
    >
    <input
      :value="condition.value"
      class="condition-form__input condition-form__input--value"
      @input="updateInput('value', $event.target.value)"
    >
  </div>
</template>

<script lang="ts">
import _ from 'lodash';

import { Component, Prop, Vue } from 'vue-property-decorator';

import { TempFilterCondition } from '@/lib/steps';

@Component({
  name: 'ConditionForm',
})

export default class ConditionForm extends Vue {
  @Prop({
    type: Object,
    default: () => ({ column: '', comparison: 'eq', value: ''})
  })
  condition!: TempFilterCondition;

  updateInput = _.debounce((type: string, newValue: any) => {
    const newCondition = {
      ...this.condition,
      [type]: newValue,
    };
    this.$emit('conditionUpdated', newCondition);
  }, 500);
}
</script>

<style lang="scss">

.condition-form {
  display: flex;
  flex-grow: 1;
}

.condition-form__input {
  box-sizing: border-box;
  height: 40px;
  flex-grow: 1;
  font-size: 14px;
  margin: 3px;
  padding: 8px 10px;
}
</style>
