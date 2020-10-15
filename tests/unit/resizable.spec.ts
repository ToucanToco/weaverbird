import { shallowMount, Wrapper } from '@vue/test-utils';

import FakeOtherComponent from '../../src/directives/resizable/__mocks__/FakeOtherComponent.vue';
import FakeTableComponent from '../../src/directives/resizable/__mocks__/FakeTableComponent.vue';
import ResizableTable from '../../src/directives/resizable/ResizableTable';

describe('Resizable directive', () => {
  let wrapper: Wrapper<FakeTableComponent | FakeTableComponent>;

  afterEach(() => {
    jest.restoreAllMocks();
    if (wrapper) wrapper.destroy();
  });

  describe('initalisation', () => {
    let ResizableTableStub: jest.SpyInstance;

    beforeEach(() => {
      ResizableTableStub = jest.spyOn(ResizableTable.prototype, 'getCols');
    });
    it('should create a resizable table when a table is targetted', () => {
      shallowMount(FakeTableComponent);
      expect(ResizableTableStub).toHaveBeenCalledTimes(1);
    });
    it('should not create a resizable table with another targetted element', () => {
      shallowMount(FakeOtherComponent);
      expect(ResizableTableStub).not.toHaveBeenCalled();
    });
  });
});
