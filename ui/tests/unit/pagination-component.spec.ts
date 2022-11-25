import { mount, shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import Pagination from '@/components/Pagination.vue';
import type { PaginationContext } from '@/lib/dataset/pagination';

const samplePaginationContext: PaginationContext = {
  shouldPaginate: true,
  totalCount: 7,
  pageNumber: 1,
  pageSize: 2,
  isLastPage: false,
};

describe('Pagination Component', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(Pagination, {
      propsData: {
        paginationContext: samplePaginationContext,
      },
    });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should display correct number of pagination links', () => {
    const wrapper = mount(Pagination, {
      propsData: {
        paginationContext: samplePaginationContext,
      },
    });
    const links = wrapper
      .findAll('.pagination__list li')
      .wrappers.map((lw) => ({ classes: lw.classes(), text: lw.text() }));
    expect(links).toEqual([
      { text: 'Prev', classes: ['prevnext', 'disabled'] },
      { text: '1', classes: ['active'] },
      { text: '2', classes: [] },
      { text: '3', classes: [] },
      { text: '4', classes: [] },
      { text: 'Next', classes: ['prevnext'] },
    ]);
  });

  it('should emit event when selecting a page', () => {
    const wrapper = mount(Pagination, {
      propsData: {
        paginationContext: samplePaginationContext,
      },
    });
    wrapper.findAll('.pagination__list li a').at(3).trigger('click');
    expect(wrapper.emitted('setPage')[0][0]).toStrictEqual({ pageNumber: 3 });
  });

  it('should instantiate the counter', () => {
    const wrapper = mount(Pagination, {
      propsData: {
        paginationContext: samplePaginationContext,
      },
    });
    const wrapperCounter = wrapper.find('.pagination__counter');
    expect(wrapperCounter.exists()).toBeTruthy();
  });

  it('should hide the pagination navigation if there is only one page', () => {
    const wrapper = mount(Pagination, {
      propsData: {
        paginationContext: {
          shouldPaginate: false,
          totalCount: 2,
          pageNumber: 1,
          pageSize: 10,
          isLastPage: true,
        },
      },
    });
    expect(wrapper.find('.pagination__nav').exists()).toBeFalsy();
    expect(wrapper.find('.pagination__counter').text()).toEqual('2 rows');
  });
  describe('Pagination navigation lifecycle', () => {
    const pageSize = 50;
    const totalCount = 400;
    const paginationNavigationExistsOnpageIndex = function (pageNumber: number): boolean {
      const wrapper = mount(Pagination, {
        propsData: {
          paginationContext: {
            shouldPaginate: true,
            totalCount,
            pageSize,
            pageNumber,
            isLastPage: false,
          },
        },
      });
      return wrapper.find('.pagination__list').exists();
    };
    it('should display pagination navigation on first page', () => {
      const pageIndex = 1;
      expect(paginationNavigationExistsOnpageIndex(pageIndex)).toBe(true);
    });
    it('should display pagination navigation on any middle page', () => {
      const pageIndex = totalCount / pageSize - 2;
      expect(paginationNavigationExistsOnpageIndex(pageIndex)).toBe(true);
    });
    it('should display pagination navigation on last page', () => {
      const pageIndex = totalCount / pageSize;
      expect(paginationNavigationExistsOnpageIndex(pageIndex)).toBe(true);
    });
  });
});
