<template>
  <div class="conditions-editor">
    <div class="conditions-editor__info">Filter rows matching this condition:</div>
    <ConditionsGroup
      :conditionsTree="conditionsTree"
      :is-root-group="true"
      @conditionsTreeUpdated="updateConditionsTree"
    >
      <template v-slot:default="slotProps">
        <slot v-bind="slotProps">
          <input :value="slotProps.condition" @input="slotProps.updateCondition($event.target.value)">
        </slot>
      </template>
    </ConditionsGroup>
  </div>
</template>

<script lang="ts">
/*
  This component allows editing a tree of arbitrary conditions.
  These abritrary conditions need each a form, which should be defined in the default slot.
  This scoped slot will receive in `slotProps` its `condition`, and a `updateCondition` function.

  The trees are intentionnaly limited to 2 levels to avoid unnecessary complexity.
*/
import { Component, Prop, Vue } from 'vue-property-decorator';

import ConditionsGroup, { AbstractFilterTree } from './ConditionsGroup.vue';

@Component({
  name: 'ConditionsEditor',
  components: {
    ConditionsGroup,
  },
})

export default class ConditionsEditor extends Vue {
  @Prop({
    type: Object,
    default: () => {}
  })
  conditionsTree!: AbstractFilterTree;

  updateConditionsTree(newConditionsTree: AbstractFilterTree) {
    this.$emit('conditionsTreeUpdated', newConditionsTree);
  }
}
</script>

<style lang="scss" scoped>
$blue: #2a66a1;
$brown-grey: #888888;
$blue-extra-light: #f4f7fa;

.conditions-editor {
  font-family: 'Montserrat', sans-serif;
  letter-spacing: 1px;
}

.conditions-editor__content {
  margin-left: 20px;
  margin-top: 20px;
  position: relative;
}

.conditions-editor__content--with-switch {
  margin-top: 60px;
}

.conditions-editor__switch {
  display: inline-flex;
  left: -20px;
  position: absolute;
  top: -40px;
  z-index: 1;
}

.conditions-editor__switch-button {
  background-color: $blue-extra-light;
  border-radius: 4px 0 0 4px;
  color: $brown-grey;
  cursor: pointer;
  display: flex;
  font-size: 10px;
  font-weight: bold;
  justify-content: center;
  padding: 6px 8px;
  text-transform: uppercase;
  width: 40px;
}

.conditions-editor__switch-button--active {
  background-color: $blue;
  box-shadow: inset -10px 0px 10px -5px rgba(0, 0, 0, 0.3);
  color: #fff;
}

.conditions-editor__switch-button--right {
  border-radius: 0 4px 4px 0;
}

.conditions-editor__switch-button--right.conditions-editor__switch-button--active {
  box-shadow: inset 10px 0px 10px -5px rgba(0, 0, 0, 0.3);
}

.conditions-editor__action-buttons {
  display: flex;
  font-size: 10px;
  font-weight: bold;
  position: relative;
  text-transform: uppercase;
}

.conditions-editor__link {
  border-bottom: 1px dashed $blue;
  border-left: 1px dashed $blue;
  height: 45px;
  left: -10px;
  position: absolute;
  top: -32px;
  width: 5px;
}

.conditions-editor__input {
  height: 40px;
  flex-grow: 1;
  font-size: 14px;
  margin: 3px;
  padding: 8px 10px;
}

.conditions-editor__add-button {
  color: $blue;
  margin: 5px;

  &:hover {
    color: black;
    cursor: pointer;
  }
}
</style>
