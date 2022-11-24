import { afterEach, describe, expect, it } from 'vitest';
import { shallowMount, type Wrapper } from '@vue/test-utils';

import ArrowPagination from '@/components/ArrowPagination.vue';

describe('Arrow pagination', () => {
  let wrapper: Wrapper<ArrowPagination>;
  const createWrapper = (propsData = {}) => {
    wrapper = shallowMount(ArrowPagination, {
      propsData,
    });
  };

  afterEach(() => {
    if (wrapper) wrapper.destroy();
  });

  it('should disable prev button on first page', async () => {
    createWrapper();
    expect(wrapper.find('.arrow-pagination__button--prev').attributes('disabled')).toBe('disabled');
    wrapper.setProps({ currentPage: 2 });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.arrow-pagination__button--prev').attributes('disabled')).toBeUndefined();
  });

  it('should disable next button on last page', async () => {
    createWrapper();
    expect(wrapper.find('.arrow-pagination__button--next').attributes('disabled')).toBeUndefined();
    wrapper.setProps({ isLastPage: true });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.arrow-pagination__button--next').attributes('disabled')).toBe('disabled');
  });

  it('should disable first page button on first page', async () => {
    createWrapper();
    expect(wrapper.find('.arrow-pagination__button--first').attributes('disabled')).toBe(
      'disabled',
    );
    wrapper.setProps({ currentPage: 2 });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.arrow-pagination__button--first').attributes('disabled')).toBeUndefined();
  });

  it('should emit previous page number when clicking on prev button', () => {
    createWrapper({ currentPage: 3 });
    wrapper.find('.arrow-pagination__button--prev').trigger('click');
    expect(wrapper.emitted('pageSelected')).toHaveLength(1);
    expect(wrapper.emitted('pageSelected')[0][0]).toBe(2);
  });

  it('should emit first page number when clicking on first page button', () => {
    createWrapper({ currentPage: 3 });
    wrapper.find('.arrow-pagination__button--first').trigger('click');
    expect(wrapper.emitted('pageSelected')).toHaveLength(1);
    expect(wrapper.emitted('pageSelected')[0][0]).toBe(1);
  });

  it('should emit next page number when clicking on next button', () => {
    createWrapper({ currentPage: 3 });
    wrapper.find('.arrow-pagination__button--next').trigger('click');
    expect(wrapper.emitted('pageSelected')).toHaveLength(1);
    expect(wrapper.emitted('pageSelected')[0][0]).toBe(4);
  });
});
