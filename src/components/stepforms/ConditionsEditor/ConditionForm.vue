<template>
  <div class="condition-form">
    <input
      :value="condition.column"
      class="condition-form__input condition-form__input--column"
      @input="updateInput('column', $event.target.value)"
    />
    <input
      :value="condition.operator"
      class="condition-form__input condition-form__input--operator"
      @input="updateInput('operator', $event.target.value)"
    />
    <input
      :value="condition.value"
      class="condition-form__input condition-form__input--value"
      @input="updateInput('value', $event.target.value)"
    />
  </div>
</template>

<script lang="ts">
import _ from 'lodash';
import { Component, Prop, Vue } from 'vue-property-decorator';

import { FilterSimpleCondition } from '@/lib/steps';

const EMPTY_CONDITION: FilterSimpleCondition = { column: '', operator: 'eq', value: '' };

@Component({
  name: 'ConditionForm',
})
export default class ConditionForm extends Vue {
  @Prop({
    type: Object,
    default: () => EMPTY_CONDITION,
  })
  condition!: FilterSimpleCondition;

  created() {
    // In absence of condition, emit directly to the parent the default value
    if (this.condition === EMPTY_CONDITION) {
      this.emitUpdatedCondition(EMPTY_CONDITION);
    }
  }

  updateInput = _.debounce((type: string, newValue: any) => {
    const newCondition = {
      ...this.condition,
      [type]: newValue,
    };
    this.emitUpdatedCondition(newCondition);
  }, 500);

  emitUpdatedCondition(newCondition: FilterSimpleCondition) {
    this.$emit('conditionUpdated', newCondition);
  }
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
