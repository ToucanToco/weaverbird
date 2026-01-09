import React from 'react';
import ConditionsGroup from './ConditionsGroup';
import { AbstractFilterTree, AbstractCondition } from './tree-types';
import styles from './ConditionsEditor.module.scss'; // Assuming simple styles or reuse

/*
  This component allows editing a tree of arbitrary conditions.
  These abritrary conditions need each a form, which should be defined in the renderCondition prop.
*/

interface ConditionsEditorProps {
  conditionsTree?: AbstractFilterTree;
  defaultValue: any;
  onConditionsTreeUpdated: (tree: AbstractFilterTree) => void;
  renderCondition: (props: {
    condition: AbstractCondition;
    updateCondition: (c: AbstractCondition) => void;
    dataPath: string;
  }) => React.ReactNode;
}

export default function ConditionsEditor({
  conditionsTree,
  defaultValue,
  onConditionsTreeUpdated,
  renderCondition,
}: ConditionsEditorProps) {
  return (
    <div className={styles['conditions-editor'] || 'conditions-editor'}>
      <ConditionsGroup
        dataPath=".condition"
        conditionsTree={conditionsTree}
        defaultValue={defaultValue}
        isRootGroup={true}
        onConditionsTreeUpdated={onConditionsTreeUpdated}
        renderCondition={renderCondition}
      />
    </div>
  );
}
