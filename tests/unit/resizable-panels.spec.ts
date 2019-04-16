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
        'left-panel': '<div class="slot-left-panel"/>'
      }
    });
    const wrapperLeftPanelChild = wrapper.find('.slot-left-panel');

    expect(wrapper.exists()).toBeTruthy();
    expect(wrapperLeftPanelChild.exists()).toBeTruthy();
  });

  it('should instantiate a div into `right-panel`', () => {
    const wrapper = shallowMount(ResizablePanels, {
      slots: {
        'right-panel': '<div class="slot-right-panel"/>'
      }
    });
    const wrapperRightPanelChild = wrapper.find('.slot-right-panel');

    expect(wrapper.exists()).toBeTruthy();
    expect(wrapperRightPanelChild.exists()).toBeTruthy();
  });

});
