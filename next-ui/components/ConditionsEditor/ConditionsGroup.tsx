/**
 * Represents a tree of conditions, grouped logically.
 *
 * The default slot act as template for each condition row.
 * The logical operator switch is only displayed when there is more than one element.
 *
 * Nesting is intentionally blocked to two levels of depth to avoid unnecessary complexity.
 */
import React, { useEffect, useState } from 'react';
import classNames from 'classnames';

import FAIcon from '@/components/FAIcon';
import { AbstractCondition, AbstractFilterTree, ConditionOperator } from './tree-types';

import styles from './ConditionsGroup.module.scss';

interface ConditionsGroupProps {
  conditionsTree?: AbstractFilterTree;
  defaultValue: any;
  isRootGroup?: boolean;
  dataPath?: string;
  onConditionsTreeUpdated: (tree: AbstractFilterTree) => void;
  renderCondition: (props: {
    condition: AbstractCondition;
    updateCondition: (c: AbstractCondition) => void;
    dataPath: string;
  }) => React.ReactNode;
}

export default function ConditionsGroup({
  conditionsTree = { operator: '', conditions: [], groups: [] },
  defaultValue,
  isRootGroup = false,
  dataPath = '',
  onConditionsTreeUpdated,
  renderCondition,
}: ConditionsGroupProps) {

  // Local state might not be strictly necessary if everything is controlled, but following Vue logic
  const operator = conditionsTree.operator;
  const conditions = conditionsTree.conditions;
  const groups = conditionsTree.groups;
  const hasMultipleRows = conditions.length > 1 || (groups && groups.length > 0);

  const addGroup = () => {
    const newGroups = conditionsTree.groups ? [...conditionsTree.groups] : [];
    newGroups.push({
      operator: 'and',
      conditions: [defaultValue],
      groups: [],
    });

    const newConditionsTree = {
      ...conditionsTree,
      groups: newGroups,
    } as AbstractFilterTree;

    setOperatorIfNecessaryAndUpdateConditionTree(newConditionsTree);
  };

  const addRow = () => {
    const newConditionsTree = {
      ...conditionsTree,
      conditions: [...conditions, defaultValue],
    } as AbstractFilterTree;

    setOperatorIfNecessaryAndUpdateConditionTree(newConditionsTree);
  };

  const deleteGroup = (groupIndex: number) => {
    const newGroups = [...groups];
    newGroups.splice(groupIndex, 1);

    const newConditionsTree = {
      ...conditionsTree,
      groups: newGroups,
    } as AbstractFilterTree;

    emitUpdatedConditionTree(newConditionsTree);
    // In Vue this called resetOperatorIfNecessary, which waited nextTick.
    // Here we can just do check logic immediately or in useEffect.
    // Ideally we should calculate the derived state in one go.
    checkResetOperator(newConditionsTree);
  };

  const deleteRow = (rowIndex: number) => {
    const newConditions = [...conditions];
    newConditions.splice(rowIndex, 1);

    const newConditionsTree = {
      ...conditionsTree,
      conditions: newConditions,
    } as AbstractFilterTree;

    emitUpdatedConditionTree(newConditionsTree);
    checkResetOperator(newConditionsTree);
  };

  const checkResetOperator = (tree: AbstractFilterTree) => {
    if (tree.conditions.length === 1 && (!tree.groups || tree.groups.length === 0)) {
       const resetTree = {
           ...tree,
           operator: '' as ConditionOperator
       };
       emitUpdatedConditionTree(resetTree);
    }
  };

  const setOperatorIfNecessaryAndUpdateConditionTree = (newConditionsTree: AbstractFilterTree) => {
    if (newConditionsTree.operator === '') {
      newConditionsTree = {
        ...newConditionsTree,
        operator: 'and',
      } as AbstractFilterTree;
    }
    emitUpdatedConditionTree(newConditionsTree);
  };

  const updateCondition = (rowIndex: number) => {
    return (c: AbstractCondition) => {
      const newConditions = [...conditions];
      newConditions[rowIndex] = c;

      const newConditionsTree = {
        ...conditionsTree,
        conditions: newConditions,
      } as AbstractFilterTree;

      emitUpdatedConditionTree(newConditionsTree);
    };
  };

  const updateGroup = (groupIndex: number, g: AbstractFilterTree) => {
    const newGroups = [...groups];
    newGroups[groupIndex] = g;

    const newConditionsTree = {
      ...conditionsTree,
      groups: newGroups,
    } as AbstractFilterTree;

    emitUpdatedConditionTree(newConditionsTree);
  };

  const switchOperator = (newOperator: ConditionOperator) => {
    const newConditionsTree = {
      ...conditionsTree,
      operator: newOperator,
    } as AbstractFilterTree;
    emitUpdatedConditionTree(newConditionsTree);
  };

  const emitUpdatedConditionTree = (newConditionsTree: AbstractFilterTree) => {
    onConditionsTreeUpdated(newConditionsTree);
  };

  const isLastRow = (rowIndex: number) => {
    const hasGroups = groups && groups.length;
    const isLastCondition = rowIndex === conditions.length - 1;
    return !hasGroups && isLastCondition;
  };

  const isLastGroup = (groupIndex: number) => {
    return groupIndex === groups.length - 1;
  };

  return (
    <div
      className={classNames(styles['conditions-group'], {
        [styles['conditions-group--with-switch']]: hasMultipleRows || !isRootGroup,
      })}
    >
      {(hasMultipleRows || !isRootGroup) && (
        <div className={styles['conditions-group__switch']}>
          <div className={styles['condition-group__switch-link']} />
          <div className={styles['conditions-group__switch-buttons']}>
            <div
              className={classNames(
                styles['conditions-group__switch-button'],
                styles['conditions-group__switch-button--and'],
                { [styles['conditions-group__switch-button--active']]: operator === 'and' }
              )}
              onClick={() => switchOperator('and')}
            >
              and
            </div>
            <div
              className={classNames(
                styles['conditions-group__switch-button'],
                styles['conditions-group__switch-button--or'],
                { [styles['conditions-group__switch-button--active']]: operator === 'or' }
              )}
              onClick={() => switchOperator('or')}
            >
              or
            </div>
          </div>
        </div>
      )}

      {conditions.map((condition, rowIndex) => (
        <div key={'row' + rowIndex} className={styles['condition-row']}>
          {(hasMultipleRows || !isRootGroup) && (
            <div
              className={classNames(styles['condition-row__link'], {
                [styles['condition-row__link--last']]: isLastRow(rowIndex),
              })}
            >
              <div className={styles['condition-row__link__top']} />
              <div className={styles['condition-row__link__middle']} />
              <div className={styles['condition-row__link__bottom']} />
            </div>
          )}
          <div className={styles['condition-row__content']}>
            {renderCondition({
              dataPath: operator !== '' ? `${dataPath}.${operator}[${rowIndex}]` : dataPath,
              condition: condition,
              updateCondition: updateCondition(rowIndex),
            })}
          </div>
          {hasMultipleRows && (
            <div
              className={styles['condition-row__delete']}
              role="button"
              aria-label="Delete this group"
              onClick={() => deleteRow(rowIndex)}
            >
              <FAIcon icon="far trash-alt" />
            </div>
          )}
        </div>
      ))}

      {groups && groups.map((groupConditionTree, groupIndex) => (
        <div key={'group' + groupIndex} className={styles['conditions-group__child-group']}>
          <div
            className={classNames(styles['conditions-group__link'], {
              [styles['conditions-group__link--last']]: isLastGroup(groupIndex),
            })}
          >
            <div className={styles['conditions-group__link__top']} />
            <div className={styles['conditions-group__link__middle']} />
            <div className={styles['conditions-group__link__bottom']} />
          </div>
          <ConditionsGroup
            conditionsTree={groupConditionTree}
            dataPath={`${dataPath}.${operator}[${groupIndex + conditions.length}]`}
            defaultValue={defaultValue}
            onConditionsTreeUpdated={(tree) => updateGroup(groupIndex, tree)}
            renderCondition={renderCondition}
          />
          <div
            className={styles['conditions-group__delete']}
            role="button"
            aria-label="Delete this group"
            onClick={() => deleteGroup(groupIndex)}
          >
            <FAIcon icon="far trash-alt" />
          </div>
        </div>
      ))}

      <div className={styles['conditions-group__action-buttons']}>
        {(hasMultipleRows || !isRootGroup) && (
          <div className={styles['action-buttons__link']}>
            <div className={styles['action-buttons__link__top']} />
            <div className={styles['action-buttons__link__middle']} />
          </div>
        )}
        <div
          className={classNames(
            styles['conditions-group__add-button'],
            styles['conditions-group__add-button--condition']
          )}
          onClick={addRow}
        >
          Add condition
        </div>
        {isRootGroup && (
          <div
            className={classNames(
              styles['conditions-group__add-button'],
              styles['conditions-group__add-button--group']
            )}
            onClick={addGroup}
          >
            Add group
          </div>
        )}
      </div>
    </div>
  );
}
