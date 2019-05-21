import { expect } from 'chai';
import { shallowMount, WrapperArray } from '@vue/test-utils';
import ResizablePanels from '../../src/components/ResizablePanels.vue';

describe('Resizable Panels', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(ResizablePanels);
    const panels: WrapperArray<any> = wrapper.findAll('.resizable-panels__panel');

    expect(wrapper.exists()).to.be.true;
    expect(panels.at(0).text()).to.equal('Left panel');
    expect(panels.at(1).text()).to.equal('Right panel');
  });

  it('should instantiate a div into `left-panel`', () => {
    const wrapper = shallowMount(ResizablePanels, {
      slots: {
        'left-panel': '<div class="slot-left-panel"/>',
      },
    });
    const wrapperLeftPanelChild = wrapper.find('.slot-left-panel');

    expect(wrapper.exists()).to.be.true;
    expect(wrapperLeftPanelChild.exists()).to.be.true;
  });

  it('should instantiate a div into `right-panel`', () => {
    const wrapper = shallowMount(ResizablePanels, {
      slots: {
        'right-panel': '<div class="slot-right-panel"/>',
      },
    });
    const wrapperRightPanelChild = wrapper.find('.slot-right-panel');

    expect(wrapper.exists()).to.be.true;
    expect(wrapperRightPanelChild.exists()).to.be.true;
  });

  describe('left panel', () => {
    it('should have the default ratio apply to its width', () => {
      const wrapper = shallowMount(ResizablePanels);
      const panels: WrapperArray<any> = wrapper.findAll('.resizable-panels__panel');

      expect(panels.at(0).element.style.width).to.equal('40%');
    });
  });

  describe('right panel', () => {
    it('should have the default ratio apply to its width', () => {
      const wrapper = shallowMount(ResizablePanels);
      const panels: WrapperArray<any> = wrapper.findAll('.resizable-panels__panel');

      expect(panels.at(1).element.style.width).to.equal('60%');
    });
  });

  describe('when resizing', () => {
    it('should change the ratio', () => {
      const wrapper = shallowMount(ResizablePanels, {
        attachToDocument: true,
      });
      const resizerWrapper = wrapper.find('.resizable-panels__resizer');

      resizerWrapper.trigger('mousedown');
      wrapper.trigger('mousemove', { movementX: 100 });
      // baseRatio: 0.4
      // If I move my mouse of 100px - that is 1/10 compare to its width - then I increase my ratio by 0.1
      expect(wrapper.vm.$data.ratio).to.be.closeTo(0.5, 0.05);
    });
  });
});
