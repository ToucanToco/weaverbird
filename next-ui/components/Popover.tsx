import React, { useEffect, useRef, useState, useCallback, ReactNode, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import _ from 'lodash';
import classNames from 'classnames';

import { Alignment } from '@/components/constants';
import * as DOMUtil from '@/components/domutil';
import styles from './Popover.module.scss';

interface PopoverProps {
  visible: boolean;
  align?: Alignment;
  bottom?: boolean;
  forcePositionUpdate?: number;
  alwaysOpened?: boolean;
  shouldCalculateHeight?: boolean;
  children: ReactNode;
  onClosed?: () => void;
  /**
   * Optional container to mount the popover into.
   * Defaults to document.body if not provided.
   * Note: In Next.js/SSR, document.body is only available after mount.
   */
  container?: Element;
}

export default function Popover({
  visible,
  align = Alignment.Center,
  bottom = false,
  forcePositionUpdate = 0,
  alwaysOpened = false,
  shouldCalculateHeight = false,
  children,
  onClosed,
  container,
}: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [elementStyle, setElementStyle] = useState<CSSProperties>({});
  const [parent, setParent] = useState<HTMLElement | null>(null);
  const [parents, setParents] = useState<HTMLElement[]>([]);

  // We need to keep track of the original parent to anchor the popover
  // But we need to render the popover in the portal (body or container)

  // To simulate the Vue behavior where it's inserted in place and then moved,
  // we can use a "placeholder" ref to find the parent.
  const placeholderRef = useRef<HTMLDivElement>(null);

  // Determine the target container
  const [targetContainer, setTargetContainer] = useState<Element | null>(null);

  useEffect(() => {
    if (typeof document !== 'undefined') {
        setTargetContainer(container || document.body);
    }
  }, [container]);

  const updatePosition = useCallback(
    _.throttle(() => {
      if (!parent || !popoverRef.current || !targetContainer) return;

      const el = popoverRef.current;

      const positionContext = {
        body: targetContainer.getBoundingClientRect(),
        parent: parent.getBoundingClientRect(),
        element: el,
        window: window,
      };

      // Set alignment
      // Use type assertion to avoid @ts-ignore. DOMUtil functions return objects that match partial CSS properties.
      const computedStyle = DOMUtil.align(align, positionContext) as Record<string, string | number>;
      computedStyle.top = DOMUtil.computeTop(bottom, positionContext);
      if (shouldCalculateHeight) {
        computedStyle.height = DOMUtil.computeHeight(bottom, positionContext) as number;
      }

      // Convert to CSS properties with px
      const newStyle: CSSProperties = {};
      Object.entries(computedStyle).forEach(([k, v]) => {
          if (v !== undefined) {
             // @ts-ignore: dynamic assignment to CSSProperties
             newStyle[k as any] = `${v}px`;
          }
      });
      setElementStyle(newStyle);

    }, 16),
    [align, bottom, shouldCalculateHeight, parent, targetContainer]
  );

  // Initialize parent and parents list
  useEffect(() => {
    if (placeholderRef.current) {
        const foundParent = placeholderRef.current.parentElement;
        setParent(foundParent);

        if (foundParent && targetContainer) {
             // Get all scrollable parents
             let p = foundParent;
             const newParents: HTMLElement[] = [];
             while (p && p !== targetContainer && p !== document.body) { // Safe check
                newParents.push(p);
                if (p.parentElement) {
                    p = p.parentElement;
                } else {
                    break;
                }
             }
             setParents(newParents);
        }
    }
  }, [targetContainer]);

  // Setup listeners
  useEffect(() => {
    if (!visible || alwaysOpened || !targetContainer || !parent) return;

    updatePosition(); // Initial position update

    const clickListener = () => {
        if (onClosed) onClosed();
    };

    // In Vue: window.addEventListener('click', this.clickListener);
    // But we need to make sure we don't trigger it immediately if the click that opened it bubbles up?
    // In Vue they use @click.stop on the popover div.

    window.addEventListener('click', clickListener);
    window.addEventListener('orientationchange', updatePosition);
    window.addEventListener('resize', updatePosition);
    parents.forEach(p => p.addEventListener('scroll', updatePosition));

    return () => {
      window.removeEventListener('click', clickListener);
      window.removeEventListener('orientationchange', updatePosition);
      window.removeEventListener('resize', updatePosition);
      parents.forEach(p => p.removeEventListener('scroll', updatePosition));
    };
  }, [visible, alwaysOpened, targetContainer, parent, parents, updatePosition, onClosed]);


  // Watch forcePositionUpdate
  useEffect(() => {
      if (visible) updatePosition();
  }, [forcePositionUpdate, visible, updatePosition]);

  const handlePopoverClick = (e: React.MouseEvent) => {
      e.stopPropagation();
  };

  if (!targetContainer) return <div ref={placeholderRef} style={{ display: 'none' }} />;

  // If alwaysOpened, render in place (at placeholder location effectively, but we need to see how Vue did it)
  // Vue: if alwaysOpened, it doesn't move it to body. It stays where it is.
  if (alwaysOpened) {
      return (
        <div
          ref={popoverRef}
          className={classNames(styles['weaverbird-popover'], styles['weaverbird-popover--always-opened'], {
              [styles['weaverbird-popover--calculated-height']]: shouldCalculateHeight
          })}
          data-cy="weaverbird-popover"
          style={elementStyle}
          onClick={handlePopoverClick}
        >
          {children}
        </div>
      );
  }

  if (!visible) return <div ref={placeholderRef} style={{ display: 'none' }} />;

  // Render in portal
  return (
      <>
        <div ref={placeholderRef} style={{ display: 'none' }} />
        {createPortal(
            <div
                ref={popoverRef}
                className={classNames(styles['weaverbird-popover'], {
                    [styles['weaverbird-popover--calculated-height']]: shouldCalculateHeight
                })}
                data-cy="weaverbird-popover"
                style={elementStyle}
                onClick={handlePopoverClick}
            >
            {children}
            </div>,
            targetContainer
        )}
      </>
  );
}
