import { shallowMount, Wrapper } from '@vue/test-utils';

import FakeOtherComponent from '../../src/directives/resizable/__mocks__/FakeOtherComponent.vue';
import FakeTableComponent from '../../src/directives/resizable/__mocks__/FakeTableComponent.vue';
import { resizableTable } from '../../src/directives/resizable/resizable';
import ResizableColHandler from '../../src/directives/resizable/ResizableColHandler';
import ResizableTable, { DEFAULT_OPTIONS } from '../../src/directives/resizable/ResizableTable';

describe('Resizable directive', () => {
  let wrapper: Wrapper<FakeTableComponent | FakeTableComponent>;
  const defaultTableClass: string = DEFAULT_OPTIONS.classes?.table as string,
    defaultHandlerClass = `.${DEFAULT_OPTIONS.classes?.handler}`;

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
    let ResizableColHandlerStub: { [methodName: string]: jest.SpyInstance },
      ResizableTableStub: { [methodName: string]: jest.SpyInstance },
      handler: Wrapper<any>;
    beforeEach(() => {
      ResizableColHandlerStub = {
        create: jest.spyOn(ResizableColHandler.prototype, 'create'),
        startDragging: jest.spyOn(ResizableColHandler.prototype, 'startDragging'),
        stopDragging: jest.spyOn(ResizableColHandler.prototype, 'stopDragging'),
        resize: jest.spyOn(ResizableColHandler.prototype, 'resize'),
        reset: jest.spyOn(ResizableColHandler.prototype, 'reset'),
        destroy: jest.spyOn(ResizableColHandler.prototype, 'destroy'),
        update: jest.spyOn(ResizableColHandler.prototype, 'update'),
      };
      ResizableTableStub = {
        destroy: jest.spyOn(ResizableTable.prototype, 'destroy'),
        update: jest.spyOn(ResizableTable.prototype, 'update'),
        updateCols: jest.spyOn(ResizableTable.prototype, 'updateCols'),
        updateRows: jest.spyOn(ResizableTable.prototype, 'updateRows'),
      };
      wrapper = shallowMount(FakeTableComponent, { attachToDocument: true });
      handler = wrapper.findAll(defaultHandlerClass).at(0);
    });

    it('should assign min-width to cols', () => {
      wrapper.findAll('th').wrappers.map((col: Wrapper<any>) => {
        expect(col.element.style.minWidth).not.toBeUndefined();
      });
    });

    it('should add handlers to cols', () => {
      expect(ResizableColHandlerStub.create).toHaveBeenCalledTimes(3);
      expect(wrapper.findAll(defaultHandlerClass)).toHaveLength(3);
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

    it('should reset col size when doubleClicking on a col handler', () => {
      const col = wrapper.findAll('th').at(0);
      expect(col.element.style.minWidth).toBe('0px');
      col.element.style.minWidth = '300px';
      expect(col.element.style.minWidth).toBe('300px');
      handler.trigger('dblclick');
      expect(ResizableColHandlerStub.reset).toHaveBeenCalledTimes(1);
      expect(col.element.style.minWidth).toBe('0px');
    });

    describe('destroy', () => {
      beforeEach(() => {
        jest.clearAllMocks();
        wrapper.destroy();
      });
      it('should remove all listener', () => {
        expect(ResizableColHandlerStub.destroy).toHaveBeenCalledTimes(3);
        expect(ResizableTableStub.destroy).toHaveBeenCalledTimes(1);
      });
      it('should not call col handler methods when drag/drop on document', async () => {
        await wrapper.trigger('mouseup');
        expect(ResizableColHandlerStub.stopDragging).not.toHaveBeenCalled();
        await wrapper.trigger('mousemove');
        expect(ResizableColHandlerStub.resize).not.toHaveBeenCalled();
      });
    });

    describe('update', () => {
      beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
      });

      describe('with exact same data (other props has changed so component is still updated)', () => {
        beforeEach(() => {
          wrapper.setProps({ rows: [{ Col1: '1', Col2: '2', Col3: '3' }] });
          jest.advanceTimersByTime(1);
        });
        it('should not update cols or rows', () => {
          expect(ResizableTableStub.update).toHaveBeenCalled();
          expect(ResizableTableStub.updateCols).not.toHaveBeenCalled();
          expect(ResizableTableStub.updateRows).not.toHaveBeenCalled();
        });
      });
      describe('update rows', () => {
        beforeEach(() => {
          if (resizableTable) {
            // fake resize table
            resizableTable.colHandlers[0].options.height = 100;
          }
          wrapper.setProps({
            rows: [
              { Col1: '1', Col2: '2', Col3: '3' },
              { Col1: '4', Col2: '5', Col3: '6' },
            ],
          });
          jest.advanceTimersByTime(1);
        });

        it('should update rows', () => {
          expect(ResizableTableStub.update).toHaveBeenCalled();
          expect(ResizableTableStub.updateRows).toHaveBeenCalledTimes(1);
        });
        it('should update cols handlers', () => {
          resizableTable?.colHandlers.forEach((colHandler: ResizableColHandler, i: number) => {
            expect(ResizableColHandlerStub.update).toHaveBeenNthCalledWith(i + 1, {
              ...colHandler.options,
              height: 0,
            });
          });
        });
      });
      describe('update cols', () => {
        beforeEach(() => {
          wrapper.setProps({ rows: [{ Col1: '1', Col2: '2' }] });
          jest.advanceTimersByTime(1);
        });
        it('should update cols', () => {
          expect(ResizableTableStub.update).toHaveBeenCalled();
          expect(ResizableTableStub.updateCols).toHaveBeenCalledTimes(1);
        });
        it('should destroy previous cols handlers', () => {
          expect(ResizableTableStub.destroy).toHaveBeenCalledTimes(1);
          expect(ResizableColHandlerStub.destroy).toHaveBeenCalledTimes(3);
        });
        it('should add new cols handlers', () => {
          expect(ResizableColHandlerStub.create).toHaveBeenCalledTimes(2);
          expect(wrapper.findAll(defaultHandlerClass)).toHaveLength(2);
        });
      });
    });
  });

  describe('custom options', () => {
    describe('without custom options', () => {
      beforeEach(() => {
        wrapper = shallowMount(FakeTableComponent);
      });
      it('should add the default class to table', () => {
        expect(wrapper.classes()).toContain(defaultTableClass);
      });
      it('should add the default class to handlers', () => {
        expect(wrapper.findAll(defaultHandlerClass)).toHaveLength(3);
      });
    });
    describe('with custom options', () => {
      beforeEach(() => {
        wrapper = shallowMount(FakeTableComponent, {
          propsData: {
            options: {
              classes: { table: 'test', handler: 'test__handler' },
            },
          },
        });
      });
      it('should add the custom class to table', () => {
        expect(wrapper.classes()).not.toContain(defaultTableClass);
        expect(wrapper.classes()).toContain('test');
      });
      it('should add the custom class to handlers', () => {
        expect(wrapper.findAll(defaultHandlerClass)).toHaveLength(0);
        expect(wrapper.findAll('.test__handler')).toHaveLength(3);
      });
    });
  });
});

describe('ResizableColHandler', () => {
  describe('getColPadding', () => {
    let col: HTMLElement, computedStyleStub: jest.SpyInstance;
    const resizableColHandler: ResizableColHandler = new ResizableColHandler({
      height: 100,
      minWidth: 120,
      className: 'my_custom__hander_class',
    });
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
