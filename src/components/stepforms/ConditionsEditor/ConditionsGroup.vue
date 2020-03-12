<template>
  <div
    class="conditions-group"
    :class="{
      'conditions-group--with-switch': hasMultipleRows,
    }"
  >
    <div v-if="hasMultipleRows" class="conditions-group__switch">
      <div class="condition-group__switch-link" />
      <div class="conditions-group__switch-buttons">
        <div
          class="conditions-group__switch-button conditions-group__switch-button--and"
          :class="{ 'conditions-group__switch-button--active': operator === 'and' }"
          @click="switchOperator('and')"
        >
          and
        </div>
        <div
          class="conditions-group__switch-button conditions-group__switch-button--or"
          :class="{ 'conditions-group__switch-button--active': operator === 'or' }"
          @click="switchOperator('or')"
        >
          or
        </div>
      </div>
    </div>
    <div v-for="(condition, rowIndex) in conditions" :key="'row' + rowIndex" class="condition-row">
      <div
        v-if="hasMultipleRows"
        class="condition-row__link"
        :class="{
          'condition-row__link--last': isLastRow(rowIndex),
        }"
      >
        <div class="condition-row__link__top" />
        <div class="condition-row__link__middle" />
        <div class="condition-row__link__bottom" />
      </div>
      <div class="condition-row__content">
        <slot :condition="condition" :updateCondition="updateCondition(rowIndex)" />
      </div>
      <i
        v-if="conditions.length > 1"
        class="condition-row__delete far fa-trash-alt"
        @click="deleteRow(rowIndex)"
      />
    </div>
    <div
      class="conditions-group__child-group"
      v-for="(groupConditionTree, groupIndex) in groups"
      :key="'group' + groupIndex"
    >
      <div
        class="conditions-group__link"
        :class="{ 'conditions-group__link--last': isLastGroup(groupIndex) }"
      >
        <div class="conditions-group__link__top" />
        <div class="conditions-group__link__middle" />
        <div class="conditions-group__link__bottom" />
      </div>
      <ConditionsGroup
        :conditions-tree="groupConditionTree"
        @conditionsTreeUpdated="updateGroup(groupIndex, $event)"
      >
        <template v-slot:default="slotProps">
          <slot v-bind="slotProps" />
        </template>
      </ConditionsGroup>
      <i class="conditions-group__delete far fa-trash-alt" @click="deleteGroup(groupIndex)" />
    </div>
    <div class="conditions-group__action-buttons">
      <div v-if="hasMultipleRows" class="action-buttons__link">
        <div class="action-buttons__link__top" />
        <div class="action-buttons__link__middle" />
      </div>
      <div
        class="conditions-group__add-button conditions-group__add-button--condition"
        @click="addRow"
      >
        Add condition
      </div>
      <div
        class="conditions-group__add-button conditions-group__add-button--group"
        v-if="isRootGroup"
        @click="addGroup"
      >
        Add group
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import { AbstractCondition, AbstractFilterTree, ConditionOperator } from './tree-types';

@Component({
  name: 'ConditionsGroup',
})
export default class ConditionsGroup extends Vue {
  @Prop({
    type: Object,
    default: () => ({ operator: '', conditions: [], groups: [] }),
  })
  conditionsTree!: AbstractFilterTree;

  @Prop({
    type: Boolean,
    default: false,
  })
  isRootGroup!: boolean;

  get operator() {
    return this.conditionsTree.operator;
  }

  get conditions() {
    return this.conditionsTree.conditions;
  }

  get groups() {
    return this.conditionsTree.groups;
  }

  get hasMultipleRows() {
    return this.conditions.length > 1 || (this.groups && this.groups.length > 0);
  }

  addGroup() {
    const newGroups = this.conditionsTree.groups || [];
    newGroups.push({
      operator: 'and',
      // Pass undefined values to force ConditionForm to use its default condition prop value
      conditions: [undefined, undefined],
      groups: [],
    });

    const newConditionsTree = {
      ...this.conditionsTree,
      groups: newGroups,
    };
    this.emitUpdatedConditionTree(newConditionsTree);
  }

  addRow() {
    const newConditionsTree = {
      ...this.conditionsTree,
      // Pass undefined value to force ConditionForm to use its default condition prop value
      conditions: [...this.conditions, undefined],
    };
    this.emitUpdatedConditionTree(newConditionsTree);
  }

  deleteGroup(groupIndex: number) {
    const newGroups = [...this.groups];
    newGroups.splice(groupIndex, 1);

    const newConditionsTree = {
      ...this.conditionsTree,
      groups: newGroups,
    };

    this.emitUpdatedConditionTree(newConditionsTree);
  }

  deleteRow(rowIndex: number) {
    const newConditions = [...this.conditions];
    newConditions.splice(rowIndex, 1);

    const newConditionsTree = {
      ...this.conditionsTree,
      conditions: newConditions,
    };

    this.emitUpdatedConditionTree(newConditionsTree);
  }

  isLastRow(rowIndex: number) {
    const hasGroups = this.groups && this.groups.length;
    const isLastCondition = rowIndex === this.conditions.length - 1;
    return !hasGroups && isLastCondition;
  }

  isLastGroup(groupIndex: number) {
    return groupIndex === this.groups.length - 1;
  }

  updateCondition(rowIndex: number) {
    return (c: AbstractCondition) => {
      const newConditions = [...this.conditions];
      newConditions[rowIndex] = c;

      const newConditionsTree = {
        ...this.conditionsTree,
        conditions: newConditions,
      };

      this.emitUpdatedConditionTree(newConditionsTree);
    };
  }

  updateGroup(groupIndex: number, g: AbstractFilterTree) {
    const newGroups = [...this.groups];
    newGroups[groupIndex] = g;

    const newConditionsTree = {
      ...this.conditionsTree,
      groups: newGroups,
    };

    this.emitUpdatedConditionTree(newConditionsTree);
  }

  switchOperator(newOperator: ConditionOperator) {
    const newConditionsTree = {
      ...this.conditionsTree,
      operator: newOperator,
    };
    this.emitUpdatedConditionTree(newConditionsTree);
  }

  emitUpdatedConditionTree(newConditionsTree: AbstractFilterTree) {
    this.$emit('conditionsTreeUpdated', newConditionsTree);
  }
}
</script>

<style lang="scss">
$blue: #2a66a1;
$brown-grey: #888888;
$brown-grey-two: #aaaaaa;
$blue-extra-light: #f4f7fa;
$grey-light-2: #eeeeee;

$conditions-group-top-margin: 20px;
$conditions-group-top-padding: 20px;
$conditions-group-left-padding: 20px;
$conditions-group-child-left-padding: 30px;
$conditions-group-bottom-right-padding: 15px;
$conditions-group-border-width: 1px;

.conditions-group {
  position: relative;
  padding-top: $conditions-group-top-padding;
  padding-bottom: $conditions-group-bottom-right-padding;
}

.conditions-group__child-group .conditions-group {
  padding-left: $conditions-group-child-left-padding;
  padding-right: $conditions-group-bottom-right-padding;
}

.conditions-group--with-switch {
  padding-top: 40px;
  padding-left: $conditions-group-left-padding;
}

.conditions-group__child-group .conditions-group--with-switch {
  padding-left: $conditions-group-child-left-padding;
}

.conditions-group__switch {
  left: 0;
  position: absolute;
  top: 10px;
}

.conditions-group__child-group .conditions-group__switch {
  left: 10px;
}

.conditions-group__switch-buttons {
  box-sizing: border-box;
  display: inline-flex;
  z-index: 1;
}

.conditions-group__delete {
  color: $brown-grey-two;
  font-size: 16px;
  position: absolute;
  right: 15px;
  top: 15px;

  &:hover {
    color: #000;
    cursor: pointer;
  }
}

.conditions-group__switch-button {
  background-color: $grey-light-2;
  border-radius: 4px 0 0 4px;
  color: $brown-grey;
  cursor: pointer;
  display: flex;
  font-family: 'Montserrat', sans-serif;
  font-size: 10px;
  font-weight: bold;
  justify-content: center;
  padding: 6px 8px;
  text-transform: uppercase;
  width: 40px;

  &:last-child {
    border-radius: 0 4px 4px 0;
  }

  &:last-child.conditions-group__switch-button--active {
    box-shadow: inset 10px 0px 10px -5px rgba(0, 0, 0, 0.3);
  }
}

.conditions-group__switch-button--active {
  background-color: $blue;
  box-shadow: inset -10px 0px 10px -5px rgba(0, 0, 0, 0.3);
  color: #fff;
}

.conditions-group__action-buttons {
  display: flex;
  font-family: 'Montserrat', sans-serif;
  font-size: 10px;
  font-weight: bold;
  position: relative;
  text-transform: uppercase;
}

.conditions-group__child-group {
  position: relative;
  background: $blue-extra-light;
  border: $conditions-group-border-width solid $grey-light-2;
  border-radius: 3px;
  margin-top: $conditions-group-top-margin;

  .condition-row {
    background-color: darken($blue-extra-light, 5%);
  }
}

.condition-group__switch-link {
  border-left: 1px solid $blue;
  height: 50%;
  position: absolute;
  left: 10px;
  top: 100%;
}

.conditions-group__input {
  height: 40px;
  flex-grow: 1;
  font-size: 14px;
  margin: 3px;
  padding: 8px 10px;
}

.conditions-group__add-button {
  color: $blue;
  margin: 5px;

  &:hover {
    color: black;
    cursor: pointer;
  }
}

$condition-row-margin: 10px;
$condition-row-border-width: 1px;

.condition-row {
  align-items: center;
  background-color: $blue-extra-light;
  border: $condition-row-border-width solid $grey-light-2;
  border-radius: 3px;
  display: flex;
  margin: $condition-row-margin 0;
  position: relative;
}

.condition-row__content {
  flex: 1;
  // overflow: auto;
}

.condition-row__delete {
  color: $brown-grey-two;
  font-size: 16px;
  margin: 0 12px;

  &:hover {
    color: #000;
    cursor: pointer;
  }
}

.condition-row__link {
  $row-link-width: $condition-row-margin + $condition-row-border-width;

  height: calc(100% + #{2 * $condition-row-margin + $condition-row-border-width});
  left: -$row-link-width;
  position: absolute;
  width: $row-link-width;

  .condition-row__link__middle {
    height: 0;
    width: 100%;
    border-bottom: 1px solid $blue;
  }

  .condition-row__link__top,
  .condition-row__link__bottom {
    height: 50%;
    border-left: 1px solid $blue;
  }
}

.conditions-group__link {
  $link-width: $conditions-group-top-margin / 2 + 2 * $conditions-group-border-width +
    $conditions-group-left-padding / 2;

  display: flex;
  flex-direction: column;
  top: -$conditions-group-top-margin;

  height: calc(100% + #{$conditions-group-top-margin + 2 * $conditions-group-border-width});
  left: -$conditions-group-top-margin / 2 - $conditions-group-border-width;
  position: absolute;
  width: $link-width;

  .conditions-group__link__middle {
    height: 0;
    width: 100%;
    border-bottom: 1px solid $blue;
  }

  .conditions-group__link__top {
    // Position the middle link centered to the operator buttons
    height: $conditions-group-top-margin + $conditions-group-top-padding;
  }

  .conditions-group__link__bottom {
    flex: 1;
    border-left: 1px solid $blue;
  }

  .conditions-group__link__top,
  .conditions-group__link__bottom {
    border-left: 1px solid $blue;
  }
}

// Last link is dashed, to the action buttons
.condition-row__link--last {
  .condition-row__link__bottom {
    border-left-style: dashed;
  }
}

.conditions-group__link--last {
  .conditions-group__link__bottom {
    border-left-style: dashed;
  }
}

.action-buttons__link {
  $action-button-link-width: $condition-row-margin;

  height: 100%;
  left: -$action-button-link-width;
  position: absolute;
  width: $action-button-link-width;

  .action-buttons__link__top {
    height: 50%;
    border-left: 1px dashed $blue;
  }

  .action-buttons__link__middle {
    height: 0;
    width: 100%;
    border-bottom: 1px dashed $blue;
  }
}
</style>
