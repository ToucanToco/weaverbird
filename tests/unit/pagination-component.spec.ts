import { mount, shallowMount } from '@vue/test-utils';

import Pagination from '@/components/Pagination.vue';
import { PaginationContext } from '@/lib/dataset/pagination';

const samplePaginationContext: PaginationContext = {
  totalCount: 7,
  pageno: 1,
  pagesize: 2,
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
      .wrappers.map(lw => ({ classes: lw.classes(), text: lw.text() }));
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
    wrapper
      .findAll('.pagination__list li a')
      .at(3)
      .trigger('click');
    expect(wrapper.emitted('setPage')[0][0]).toStrictEqual({ pageno: 3 });
  });

  it('should instantiate the counter', () => {
    const wrapper = mount(Pagination, {
      propsData: {
        paginationContext: samplePaginationContext,
      },
    });
    const wrapperCounter = wrapper.find('.pagination-counter');
    expect(wrapperCounter.exists()).toBeTruthy();
  });

  it('should hide the pagination navigation if there is only one page', () => {
    const wrapper = mount(Pagination, {
      propsData: {
        paginationContext: { ...samplePaginationContext, totalCount: 2 },
      },
    });
    expect(wrapper.find('.pagination__list').exists()).toBeFalsy();
    expect(wrapper.find('.pagination-counter__current-min').exists()).toBeFalsy();
    expect(wrapper.find('.pagination-counter__current-max').exists()).toBeFalsy();
    expect(wrapper.find('.pagination-counter__total-count').text()).toEqual('2 rows');
  });
  describe('Pagination navigation lifecycle', () => {
    const pagesize = 50;
    const totalCount = 400;
    const paginationNavigationExistsOnpageIndex = function(pageno: number): boolean {
      const wrapper = mount(Pagination, {
        propsData: {
          paginationContext: {
            totalCount,
            pagesize,
            pageno,
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
      const pageIndex = totalCount / pagesize - 2;
      expect(paginationNavigationExistsOnpageIndex(pageIndex)).toBe(true);
    });
    it('should display pagination navigation on last page', () => {
      const pageIndex = totalCount / pagesize;
      expect(paginationNavigationExistsOnpageIndex(pageIndex)).toBe(true);
    });
  });
});
