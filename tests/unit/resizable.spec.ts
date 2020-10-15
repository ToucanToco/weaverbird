import { shallowMount, Wrapper } from '@vue/test-utils';

import FakeOtherComponent from '../../src/directives/resizable/__mocks__/FakeOtherComponent.vue';
import FakeTableComponent from '../../src/directives/resizable/__mocks__/FakeTableComponent.vue';
import ResizableColHandler from '../../src/directives/resizable/ResizableColHandler';
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

  describe('default', () => {
    let ResizableColHandlerStub: jest.SpyInstance;
    beforeEach(() => {
      ResizableColHandlerStub = jest.spyOn(ResizableColHandler.prototype, 'create');
      wrapper = shallowMount(FakeTableComponent);
    });

    it('should assign min-width to cols', () => {
      wrapper.findAll('th').wrappers.map((col: Wrapper<any>) => {
        expect(col.element.style.minWidth).not.toBeUndefined();
      });
    });

    it('should add handlers to cols', () => {
      expect(ResizableColHandlerStub).toHaveBeenCalledTimes(3);
      expect(wrapper.findAll('.table__handler')).toHaveLength(3);
    });

    it('should apply the right style to a col handler', () => {
      const handlerElement: HTMLElement = wrapper.findAll('.table__handler').at(0).element;
      expect(handlerElement.nodeName).toBe('DIV');
      expect(handlerElement.style.top).toBe('0px');
      expect(handlerElement.style.right).toBe('-4px');
      expect(handlerElement.style.width).toBe('7px');
      expect(handlerElement.style.position).toBe('absolute');
      expect(handlerElement.style.cursor).toBe('col-resize');
      expect(handlerElement.style.zIndex).toBe('1');
      expect(handlerElement.style.userSelect).toBe('none');
      expect(handlerElement.style.height).toBe('10px');
    });
  });
});
