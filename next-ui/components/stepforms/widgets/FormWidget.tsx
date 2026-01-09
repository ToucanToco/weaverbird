import React, { useMemo } from 'react';
import classNames from 'classnames';
import styles from './FormWidget.module.scss';

// Since error objects from AJV can be complex, we define a minimal interface here or reuse existing one.
// Assuming ErrorObject has at least dataPath and message.
export interface FormWidgetProps {
  dataPath?: string;
  errors?: any[]; // ErrorObject[]
  warning?: string;
}

export function useFormWidget({ dataPath, errors, warning }: FormWidgetProps) {
  const error = useMemo(() => {
    if (!errors) return undefined;
    return errors.find((d) => d.dataPath === dataPath);
  }, [errors, dataPath]);

  const messageError = error?.message;

  const messageWarning = warning || null;

  const toggleClassErrorWarning = useMemo(() => ({
    [styles['field--error']]: !!messageError,
    [styles['field--warning']]: !messageError && !!messageWarning,
  }), [messageError, messageWarning]);

  return {
    messageError,
    messageWarning,
    toggleClassErrorWarning
  };
}

// Since FormWidget in Vue was a Mixin/Base class, here we provide a Hook or a Base Wrapper.
// The hook approach is more React-like.
