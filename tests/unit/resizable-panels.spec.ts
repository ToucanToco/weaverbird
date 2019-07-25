import { shallowMount, WrapperArray } from '@vue/test-utils';
import ResizablePanels from '../../src/components/ResizablePanels.vue';

describe('Resizable Panels', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(ResizablePanels);
    const panels: WrapperArray<any> = wrapper.findAll('.resizable-panels__panel');

    expect(wrapper.exists()).toBeTruthy();
    expect(panels.at(0).text()).toEqual('Left panel');
    expect(panels.at(1).text()).toEqual('Right panel');
  });

  it('should instantiate a div into `left-panel`', () => {
    const wrapper = shallowMount(ResizablePanels, {
      slots: {
        'left-panel': '<div class="slot-left-panel"/>',
      },
    });
    const wrapperLeftPanelChild = wrapper.find('.slot-left-panel');

    expect(wrapper.exists()).toBeTruthy();
    expect(wrapperLeftPanelChild.exists()).toBeTruthy();
  });

  it('should instantiate a div into `right-panel`', () => {
    const wrapper = shallowMount(ResizablePanels, {
      slots: {
        'right-panel': '<div class="slot-right-panel"/>',
      },
    });
    const wrapperRightPanelChild = wrapper.find('.slot-right-panel');

    expect(wrapper.exists()).toBeTruthy();
    expect(wrapperRightPanelChild.exists()).toBeTruthy();
  });

  describe('left panel', () => {
    it('should have the default ratio apply to its width', () => {
      const wrapper = shallowMount(ResizablePanels);
      const panels: WrapperArray<any> = wrapper.findAll('.resizable-panels__panel');

      expect(panels.at(0).element.style.width).toEqual('40%');
    });
  });

  describe('right panel', () => {
    it('should have the default ratio apply to its width', () => {
      const wrapper = shallowMount(ResizablePanels);
      const panels: WrapperArray<any> = wrapper.findAll('.resizable-panels__panel');

      expect(panels.at(1).element.style.width).toEqual('60%');
    });
  });

  describe('when resizing', () => {
    it('should change the ratio', () => {
      const boundingRectSpy = jest
        .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
        .mockImplementation(() => ({
          x: 0,
          y: 0,
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          // set width to 1000px so that moving mouse from 100px will change the global
          // ratio of 10%
          width: 1000,
          height: 1000,
        }));
      const wrapper = shallowMount(ResizablePanels, {
        attachToDocument: true,
      });
      const resizerWrapper = wrapper.find('.resizable-panels__resizer');

      resizerWrapper.trigger('mousedown');
      wrapper.trigger('mousemove', { movementX: 100 });
      // baseRatio: 0.4
      // If I move my mouse of 100px - that is 1/10 compare to its width - then I increase my ratio by 0.1
      // expect(wrapper.vm.$data.ratio).to.be.closeTo(0.5, 0.05);
      expect(wrapper.vm.$data.ratio).toBeCloseTo(0.5, 2);
      boundingRectSpy.mockRestore();
    });
  });
});
