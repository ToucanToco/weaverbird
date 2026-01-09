import React, { useEffect, useState } from 'react';
import classNames from 'classnames';
import styles from './Tabs.module.scss';

interface TabsProps {
  tabs?: string[];
  disabledTabs?: string[];
  selectedTab?: string;
  formatTab?: (tab: string) => string;
  compactMode?: boolean;
  onTabSelected?: (tab: string) => void;
  // Slots in Vue are a bit more flexible. Here we can probably just use a render prop or children if we needed dynamic content per tab.
  // But looking at the Vue component: <slot :tab="tab" />. It renders content INSIDE the tab header?
  // Yes, allows customizing the tab label.
  children?: (tab: string) => React.ReactNode;
}

export default function Tabs({
  tabs = [],
  disabledTabs = [],
  selectedTab,
  formatTab = (tab: string) => `${tab}`,
  compactMode = false,
  onTabSelected,
  children
}: TabsProps) {

  const isTabDisabled = (tab: string) => disabledTabs.indexOf(tab) !== -1;

  // In Vue `created` hook selects the first available tab if selectedTab is invalid.
  // We can do this with useEffect, but we should be careful not to cause infinite loops if onTabSelected updates the prop.
  useEffect(() => {
    const availableTabs = tabs.filter((t) => disabledTabs.indexOf(t) === -1);
    const tabIsUnavailable =
      selectedTab == null || availableTabs.indexOf(selectedTab) === -1;

    if (tabIsUnavailable && availableTabs.length > 0) {
       if (onTabSelected) {
           onTabSelected(availableTabs[0]);
       }
    }
  }, [tabs, disabledTabs, selectedTab, onTabSelected]);

  const handleSelectTab = (tab: string) => {
    if (!isTabDisabled(tab)) {
      if (onTabSelected) onTabSelected(tab);
    }
  };

  return (
    <div className={classNames(styles.tabs, { [styles['tabs--compact']]: compactMode })}>
      <div className={styles['tabs__tabs-container']}>
        {tabs.map((tab) => (
          <div
            key={tab}
            className={classNames(styles['tabs__tab'], {
              [styles['tabs__tab--disabled']]: isTabDisabled(tab),
              [styles['tabs__tab--selected']]: selectedTab === tab,
            })}
            data-cy="weaverbird-tabs-tab"
            onClick={() => handleSelectTab(tab)}
          >
            {formatTab(tab)}
            {children ? children(tab) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
