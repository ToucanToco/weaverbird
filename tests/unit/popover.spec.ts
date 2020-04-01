import { mount, Wrapper } from '@vue/test-utils';
import _ from 'lodash';
import Vue from 'vue';

import { Alignment, POPOVER_SHADOW_GAP } from '@/components/constants';
import * as DOMUtil from '@/components/domutil';
import Popover from '@/components/Popover.vue';

type Dict<T> = { [key: string]: T };

function mockBoundingRect(this: HTMLElement): DOMRect {
  const defaultRect: DOMRect = {
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    x: 0,
    y: 0,
    toJSON: () => {},
  };
  const elementStyle: Dict<number> = {};
  for (const prop of Object.keys(defaultRect)) {
    const style: Dict<string> = (this.style as unknown) as Dict<string>;
    elementStyle[prop] = style[prop] ? Number(style[prop].slice(0, -2)) : 0;
  }
  return { ...defaultRect, ...elementStyle };
}

describe('DOM Position Tests', () => {
  it('should compute top based on parent top and offset height if enough space', () => {
    const top = DOMUtil.computeTop(false, {
      body: { top: 100 },
      parent: { top: 150, height: 500 },
      element: { offsetHeight: 20 },
      window: { innerHeight: 30 },
    });
    expect(top).toEqual(22);
  });

  it('should compute top as topBelow if not isBottom and not enough space', () => {
    const top = DOMUtil.computeTop(false, {
      body: { top: 100 },
      parent: { top: 150, height: 500 },
      element: { offsetHeight: 100 },
      window: { innerHeight: 3000 },
    });
    expect(top).toEqual(550);
  });

  it('should compute top / isBottom based on parent top and offset height if enough space', () => {
    const top = DOMUtil.computeTop(true, {
      body: { top: 100 },
      parent: { top: 150, height: 500 },
      element: { offsetHeight: 20 },
      window: { innerHeight: 3000 },
    });
    expect(top).toEqual(550);
  });

  it('should compute top as topAbove if isBottom and not enough space', () => {
    const top = DOMUtil.computeTop(true, {
      body: { top: 100 },
      parent: { top: 150, height: 500 },
      element: { offsetHeight: 20 },
      window: { innerHeight: 30 },
    });
    expect(top).toEqual(22);
  });

  it('should align center if enough space in window', () => {
    const position = DOMUtil.align(Alignment.Center, {
      body: { left: 10 },
      parent: { left: 50, width: 200 },
      element: { offsetWidth: 20 },
      window: { innerWidth: 1800 },
    });
    expect(position).toEqual({ left: 130 });
  });

  it('should align center if not enough space in window', () => {
    const position = DOMUtil.align(Alignment.Center, {
      body: { left: 10 },
      parent: { left: 50, width: 200 },
      element: { offsetWidth: 20 },
      window: { innerWidth: 100 },
    });
    expect(position).toEqual({ left: 220 });
  });

  it('should align center if negative left', () => {
    const position = DOMUtil.align(Alignment.Center, {
      body: { left: 1000 },
      parent: { left: 50, width: 200 },
      element: { offsetWidth: 20 },
      window: { innerWidth: 100 },
    });
    expect(position).toEqual({ left: -950 });
  });

  it('should align justify', () => {
    const position = DOMUtil.align(Alignment.Justify, {
      body: { left: 10 },
      parent: { left: 50, width: 200 },
      element: { offsetWidth: 20 },
      window: { innerWidth: 100 },
    });
    expect(position).toEqual({ left: 40, width: 200 });
  });

  it('should align left if enough space in window', () => {
    const position = DOMUtil.align(Alignment.Left, {
      body: { left: 10 },
      parent: { left: 50, width: 200 },
      element: { offsetWidth: 20 },
      window: { innerWidth: 1800 },
    });
    expect(position).toEqual({ left: 40 });
  });

  it('should align left if not enough space in window', () => {
    const position = DOMUtil.align(Alignment.Left, {
      body: { left: 10 },
      parent: { left: 50, width: 200 },
      element: { offsetWidth: 20 },
      window: { innerWidth: 10 },
    });
    expect(position).toEqual({ left: 220 });
  });

  it('should align right if enough space in window', () => {
    const position = DOMUtil.align(Alignment.Right, {
      body: { left: 10 },
      parent: { left: 50, width: 200 },
      element: { offsetWidth: 20 },
      window: { innerWidth: 1800 },
    });
    expect(position).toEqual({ left: 220 });
  });

  it('should align right if not enough space', () => {
    const position = DOMUtil.align(Alignment.Right, {
      body: { left: 10 },
      parent: { left: 50, width: 200 },
      element: { offsetWidth: 300 },
      window: { innerWidth: 10000 },
    });
    expect(position).toEqual({ left: 40 });
  });
});

describe('Popover', function() {
  let wrapper: Wrapper<Vue>;
  let popoverWrapper: Wrapper<Vue>;
  let throttleSpy: jest.SpyInstance<Function>;
  let boundingRectSpy: jest.SpyInstance<ClientRect>;

  const createWrapper = (...args: any) => {
    const val = args[0],
      obj = val != null ? val : {},
      val1 = obj.parentStyle,
      parentStyle = val1 != null ? val1 : {},
      val2 = obj.props,
      props = val2 != null ? val2 : {},
      val3 = obj.slotStyle,
      slotStyle = val3 != null ? val3 : {},
      val4 = obj.slotText,
      slotText = val4 != null ? val4 : '';
    wrapper = mount(
      {
        components: { Popover },
        render(createElement) {
          return createElement(
            'div',
            {
              style: parentStyle,
            },
            [
              createElement(
                Popover,
                {
                  props,
                  ref: 'popover',
                },
                [
                  createElement(
                    'div',
                    {
                      class: 'slot-content',
                      style: slotStyle,
                    },
                    slotText,
                  ),
                ],
              ),
              createElement('div', { attrs: { id: 'anotherelement' } }, [
                createElement('div', 'My tay;or is rich'),
              ]),
            ],
          );
        },
      },
      {
        attachToDocument: true,
      },
    );
    popoverWrapper = wrapper.find({ ref: 'popover' });
  };

  beforeEach(function() {
    throttleSpy = jest.spyOn(_, 'throttle').mockImplementation((fn: any) => fn);
    boundingRectSpy = jest
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(mockBoundingRect);
  });

  afterEach(function() {
    wrapper.destroy();
    throttleSpy.mockRestore();
    boundingRectSpy.mockRestore();
  });

  it('should instantiate a popover', function() {
    createWrapper({ props: { visible: true } });
    expect(_.isElement(popoverWrapper.element)).toBeTruthy();
  });

  it('should instantiate a popover', function() {
    createWrapper({ props: { visible: false } });
    expect(_.isElement(popoverWrapper.element)).toBeFalsy();
  });

  it('should include the passed slot content', function() {
    createWrapper({ props: { visible: true }, slotText: 'Lorem ipsum' });
    const slotContentWrapper = popoverWrapper.find('.slot-content');

    expect(slotContentWrapper.exists()).toBeTruthy();
    expect(slotContentWrapper.text()).toEqual('Lorem ipsum');
  });

  it('should append itself to the document body', function() {
    createWrapper({ props: { visible: true } });

    expect(popoverWrapper.element.parentElement).toEqual(document.body);
  });

  it('should remove its DOM upon destruction', function() {
    createWrapper({ props: { visible: true } });
    popoverWrapper.destroy();

    expect(document.body.querySelector('.tc-popover')).toBeNull();
  });

  it('should be above by default', async function() {
    createWrapper({
      props: { visible: true },
      parentStyle: {
        height: '40px',
        left: '200px',
        position: 'absolute',
        top: '200px',
        width: '100px',
      },
    });

    await wrapper.vm.$nextTick();
    const parentBounds = wrapper.element.getBoundingClientRect();
    const popoverBounds = popoverWrapper.vm.$data.elementStyle;

    expect(popoverBounds.top).toEqual(`${parentBounds.top - POPOVER_SHADOW_GAP}px`);
    expect(popoverBounds.left).toEqual(`${parentBounds.left + 100 / 2}px`);
  });

  it('should update its position on orientation change', async function() {
    createWrapper({
      props: { visible: true },
      parentStyle: {
        height: '40px',
        left: '200px',
        position: 'absolute',
        top: '200px',
        width: '100px',
      },
    });
    const popoverWrapper = wrapper.find({ ref: 'popover' });

    await wrapper.vm.$nextTick();
    wrapper.element.style.left = '100px';
    window.dispatchEvent(new Event('orientationchange'));

    await wrapper.vm.$nextTick();
    const parentBounds = wrapper.element.getBoundingClientRect();
    const popoverBounds = popoverWrapper.vm.$data.elementStyle;

    expect(popoverBounds.left).toEqual(`${parentBounds.left + 100 / 2}px`);
  });

  it('should update its position when resized', async function() {
    createWrapper({
      props: { visible: true },
      parentStyle: {
        height: '40px',
        left: '200px',
        position: 'absolute',
        top: '200px',
        width: '100px',
      },
      slotStyle: {
        height: '140px',
        width: '140px',
      },
    });
    const popoverWrapper = wrapper.find({ ref: 'popover' });

    await wrapper.vm.$nextTick();
    wrapper.element.style.left = '100px';
    window.dispatchEvent(new Event('resize'));

    await wrapper.vm.$nextTick();
    const parentBounds = wrapper.element.getBoundingClientRect();
    const popoverBounds = popoverWrapper.vm.$data.elementStyle;

    expect(popoverBounds.left).toEqual(`${parentBounds.left + 100 / 2}px`);
  });

  it('should update its position when scrolled', async function() {
    createWrapper({
      props: { visible: true },
      parentStyle: {
        height: '40px',
        left: '200px',
        position: 'absolute',
        top: '200px',
        width: '100px',
      },
      slotStyle: {
        height: '140px',
        width: '140px',
      },
    });
    const popoverWrapper = wrapper.find({ ref: 'popover' });

    await wrapper.vm.$nextTick();
    wrapper.element.style.left = '100px';
    wrapper.element.dispatchEvent(new Event('scroll'));

    await wrapper.vm.$nextTick();
    const parentBounds = wrapper.element.getBoundingClientRect();
    const popoverBounds = popoverWrapper.vm.$data.elementStyle;

    expect(popoverBounds.left).toEqual(`${parentBounds.left + 100 / 2}px`);
  });

  it('should emit close on click away', async function() {
    createWrapper({
      props: { visible: true },
      parentStyle: {
        height: '40px',
        left: '200px',
        position: 'absolute',
        top: '200px',
        width: '100px',
      },
      slotStyle: {
        height: '140px',
        width: '140px',
      },
    });
    const popoverWrapper = wrapper.find({ ref: 'popover' });
    const anotherelement = wrapper.find('#anotherelement');
    await wrapper.vm.$nextTick();

    await anotherelement.trigger('click');
    await wrapper.vm.$nextTick();
    expect(popoverWrapper.emitted().closed.length).toEqual(1);
  });

  it('should not emit close on click on it', async function() {
    createWrapper({
      props: { visible: true },
      parentStyle: {
        height: '40px',
        left: '200px',
        position: 'absolute',
        top: '200px',
        width: '100px',
      },
      slotStyle: {
        height: '140px',
        width: '140px',
      },
    });
    const popoverWrapper = wrapper.find({ ref: 'popover' });
    await wrapper.vm.$nextTick();

    await popoverWrapper.trigger('click');
    await wrapper.vm.$nextTick();
    expect(popoverWrapper.emitted().closed).toBeUndefined();
  });
});
