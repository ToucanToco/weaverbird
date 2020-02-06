<template>
  <div
    class="conditions-group"
    :class="{
      'conditions-group--root': isRootGroup,
      'conditions-group--with-switch': hasMultipleRows,
    }"
  >
    <!-- <div v-if="!isRoot" class="conditions-group__link" /> -->
    <div v-if="hasMultipleRows" class="conditions-group__switch">
      <div
        id="switch-button-and"
        class="conditions-group__switch-button"
        :class="{ 'conditions-group__switch-button--active': operator === 'and' }"
        @click="switchOperator('and')"
      >
        and
      </div>
      <div
        id="switch-button-or"
        class="conditions-group__switch-button"
        :class="{ 'conditions-group__switch-button--active': operator === 'or' }"
        @click="switchOperator('or')"
      >
        or
      </div>
    </div>
    <i
      v-if="!isRootGroup"
      class="conditions-group__delete fal fa-trash-alt"
      @click="$emit('groupDeleted')"
    />
    <div v-for="(condition, rowIndex) in conditions" :key="'row' + rowIndex" class="condition-row">
      <div v-if="hasMultipleRows" class="condition-row__link" />
      <slot :condition="condition" :updateCondition="updateCondition(rowIndex)" />
      <i
        v-if="hasMultipleRows"
        class="condition-row__delete fal fa-trash-alt"
        @click="deleteRow(rowIndex)"
      />
    </div>
    <ConditionsGroup
      v-for="(groupConditionTree, groupIndex) in groups"
      :key="'group' + groupIndex"
      :conditions-tree="groupConditionTree"
      @conditionsTreeUpdated="updateGroup(groupIndex, $event)"
      @groupDeleted="deleteGroup(groupIndex)"
    >
      <template v-slot:default="slotProps">
        <slot v-bind="slotProps" />
      </template>
    </ConditionsGroup>
    <div class="conditions-group__action-buttons">
      <div v-if="hasMultipleRows" class="conditions-group__link conditions-group__link--dashed" />
      <div id="add-row-button" class="conditions-group__add-button" @click="addRow">add condition</div>
      <div id="add-group-button" class="conditions-group__add-button" v-if="isRootGroup" @click="addGroup">
        add group
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import { AbstractFilterTree, AbstractCondition, ConditionOperator } from '@/lib/steps';

@Component({
  name: 'ConditionsGroup',
})

export default class ConditionsGroup extends Vue {
  @Prop({
    type: Object,
    default: () => ({ operator: 'and', conditions: [], groups: []})
  })
  conditionsTree!: AbstractFilterTree;

  @Prop({
    type: Boolean,
    default: false
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
      conditions: [
        undefined,
        undefined,
      ],
      groups: []
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

  updateGroup(groupIndex: number, g: any) {
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

.conditions-group {
  background: $blue-extra-light;
  border: 1px solid $grey-light-2;
  border-radius: 3px;
  margin-top: 20px;
  position: relative;
  padding: 30px 15px 15px 30px;
}

.conditions-group--root {
  background: white;
  border: none;

  > .condition-row {
    background-color: $blue-extra-light;
  }
}

.conditions-group--with-switch {
  padding-top: 40px;
}

.conditions-group__switch {
  box-sizing: border-box;
  display: inline-flex;
  left: 10px;
  position: absolute;
  top: 10px;
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

.conditions-group__link {
  border-bottom: 1px solid $blue;
  border-left: 1px solid $blue;
  height: 209px;
  left: -10px;
  position: absolute;
  top: -45px;
  width: 5px;
}

.conditions-group__link--dashed {
  border-bottom: 1px dashed $blue;
  border-left: 1px dashed $blue;
  height: 45px;
  top: -32px;
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

.condition-row {
  align-items: center;
  background-color: darken($blue-extra-light, 5%);
  border: 1px solid $grey-light-2;
  border-radius: 3px;
  display: flex;
  margin: 10px 0;
  position: relative;
}

.condition-row__link {
  border-bottom: 1px solid $blue;
  border-left: 1px solid $blue;
  height: 60px;
  left: -11px;
  position: absolute;
  top: -35px;
  width: 10px;
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
</style>
