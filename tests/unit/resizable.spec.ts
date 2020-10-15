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
    let ResizableColHandlerStub: { [methodName: string]: jest.SpyInstance }, handler: Wrapper<any>;
    beforeEach(() => {
      ResizableColHandlerStub = {
        create: jest.spyOn(ResizableColHandler.prototype, 'create'),
        startDragging: jest.spyOn(ResizableColHandler.prototype, 'startDragging'),
        stopDragging: jest.spyOn(ResizableColHandler.prototype, 'stopDragging'),
        resize: jest.spyOn(ResizableColHandler.prototype, 'resize'),
      };
      wrapper = shallowMount(FakeTableComponent, { attachToDocument: true });
      handler = wrapper.findAll('.table__handler').at(0);
    });

    it('should assign min-width to cols', () => {
      wrapper.findAll('th').wrappers.map((col: Wrapper<any>) => {
        expect(col.element.style.minWidth).not.toBeUndefined();
      });
    });

    it('should add handlers to cols', () => {
      expect(ResizableColHandlerStub.create).toHaveBeenCalledTimes(3);
      expect(wrapper.findAll('.table__handler')).toHaveLength(3);
    });

    it('should apply the right style to a col handler', () => {
      expect(handler.element.nodeName).toBe('DIV');
      expect(handler.element.style.top).toBe('0px');
      expect(handler.element.style.right).toBe('-4px');
      expect(handler.element.style.width).toBe('7px');
      expect(handler.element.style.position).toBe('absolute');
      expect(handler.element.style.cursor).toBe('col-resize');
      expect(handler.element.style.zIndex).toBe('1');
      expect(handler.element.style.userSelect).toBe('none');
    });

    it('should allow to target col handler on all table height', () => {
      expect(handler.element.offsetHeight).toBe(wrapper.element.offsetHeight);
    });

    it('should save resizing width when dragging a col handler', () => {
      handler.trigger('mousedown');
      expect(ResizableColHandlerStub.startDragging).toHaveBeenCalledTimes(1);
    });

    it('should reset resizing width when stopDragging a col handler', () => {
      wrapper.trigger('mouseup');
      expect(ResizableColHandlerStub.stopDragging).toHaveBeenCalled();
    });

    it('should resize col width when mouse move a col handler', () => {
      wrapper.trigger('mousemove');
      expect(ResizableColHandlerStub.resize).toHaveBeenCalled();
    });
  });
});

describe('ResizableColHandler', () => {
  describe('getColPadding', () => {
    let col: HTMLElement, computedStyleStub: jest.SpyInstance;
    const resizableColHandler: ResizableColHandler = new ResizableColHandler({ height: 100 });
    beforeEach(() => {
      computedStyleStub = jest.spyOn(window, 'getComputedStyle');
      col = document.createElement('div');
      col.style.paddingLeft = '4px';
      col.style.paddingRight = '4px';
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should retrieve col left and right padding', () => {
      resizableColHandler.getColPadding(col);
      expect(computedStyleStub).toHaveBeenNthCalledWith(1, col, null);
      expect(computedStyleStub).toHaveBeenNthCalledWith(2, col, null);
    });

    it('should return sum of col padding', () => {
      const padding = resizableColHandler.getColPadding(col);
      expect(padding).toBe(8);
    });
  });
});
