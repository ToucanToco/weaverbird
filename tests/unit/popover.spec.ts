import _ from 'lodash';
import { mount, Wrapper } from '@vue/test-utils';
import Vue from 'vue';

import Popover from '@/components/Popover.vue';
import { POPOVER_ALIGN, POPOVER_SHADOW_GAP } from '@/lib/popover';

describe('Popover', function() {
  var wrapper: Wrapper<Vue>;
  var popoverWrapper: Wrapper<Vue>;
  jest.useFakeTimers();

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
            ],
          );
        },
      },
      {
        attachToDocument: true,
      },
    );
    popoverWrapper = wrapper.find({ ref: 'popover' });
    // Force throttle end
    jest.advanceTimersByTime(1600);
  };

  beforeEach(function() {
    jest.useFakeTimers();
  });

  afterEach(function() {
    wrapper.destroy();
  });

  it('should instanciate a popover', function() {
    createWrapper();
    expect(_.isElement(popoverWrapper.element)).toBeTruthy();
  });

  it('should include the passed slot content', function() {
    createWrapper({ slotText: 'Lorem ipsum' });
    const slotContentWrapper = popoverWrapper.find('.slot-content');

    expect(slotContentWrapper.exists()).toBeTruthy();
    expect(slotContentWrapper.text()).toEqual('Lorem ipsum');
  });

  it('should append itself to the document body', function() {
    createWrapper();

    expect(popoverWrapper.element.parentElement).toEqual(document.body);
  });

  it('should remove its DOM upon destruction', function() {
    createWrapper();
    popoverWrapper.destroy();

    expect(document.body.querySelector('.tc-popover')).toBeNull();
  });

  it('should be hidden by default', function() {
    createWrapper();
    expect(popoverWrapper.classes()).toEqual(['popover']);
  });

  xdescribe('when active', function() {
    it('should be above by default', function() {
      createWrapper({
        parentStyle: {
          height: '40px',
          left: '200px',
          position: 'absolute',
          top: '200px',
          width: '100px',
        },
        props: {
          active: true,
        },
        slotStyle: {
          height: '140px',
          width: '140px',
        },
      });
      return wrapper.vm.$nextTick().then(() => {
        const parentBounds = wrapper.element.getBoundingClientRect();
        const popoverBounds = popoverWrapper.element.getBoundingClientRect();

        return expect(popoverBounds.top).toEqual(parentBounds.top - POPOVER_SHADOW_GAP - 140);
      });
    });

    it('should be centered by default', function() {
      createWrapper({
        parentStyle: {
          height: '40px',
          left: '200px',
          position: 'absolute',
          top: '200px',
          width: '100px',
        },
        props: {
          active: true,
        },
        slotStyle: {
          height: '140px',
          width: '140px',
        },
      });

      return wrapper.vm.$nextTick().then(() => {
        const parentBounds = wrapper.element.getBoundingClientRect();
        const popoverBounds = popoverWrapper.element.getBoundingClientRect();
        expect(popoverBounds.left).toEqual(parentBounds.left + (100 - 140) / 2);
      });
    });
  });

  xit("should be aligned left when there isn't enough space on left", function() {
    createWrapper({
      parentStyle: {
        height: '40px',
        left: '0px',
        position: 'absolute',
        top: '200px',
        width: '100px',
      },
      props: {
        active: true,
      },
      slotStyle: {
        height: '140px',
        width: '140px',
      },
    });
    const popoverWrapper = wrapper.find({ ref: 'popover' });

    wrapper.vm.$nextTick().then(() => {
      const parentBounds = wrapper.element.getBoundingClientRect();
      const popoverBounds = popoverWrapper.element.getBoundingClientRect();

      return expect(popoverBounds.left).toEqual(parentBounds.left);
    });
  });

  xit("should be aligned right when there isn't enough space on right", function() {
    const parentLeft = window.innerWidth - 100;
    createWrapper({
      parentStyle: {
        height: '40px',
        left: `${parentLeft}px`,
        position: 'absolute',
        top: '200px',
        width: '100px',
      },
      props: {
        active: true,
      },
      slotStyle: {
        height: '140px',
        width: '140px',
      },
    });
    const popoverWrapper = wrapper.find({ ref: 'popover' });

    wrapper.vm.$nextTick().then(() => {
      const parentBounds = wrapper.element.getBoundingClientRect();
      const popoverBounds = popoverWrapper.element.getBoundingClientRect();

      return expect(popoverBounds.left).toEqual(parentBounds.right - 140);
    });
  });

  xit("should be below when there isn't enough place above and there is below", function() {
    createWrapper({
      parentStyle: {
        height: '40px',
        left: '200px',
        position: 'absolute',
        top: '0px',
        width: '100px',
      },
      props: {
        active: true,
      },
      slotStyle: {
        height: '140px',
        width: '140px',
      },
    });
    const popoverWrapper = wrapper.find({ ref: 'popover' });

    return wrapper.vm.$nextTick().then(() => {
      const parentBounds = wrapper.element.getBoundingClientRect();
      const popoverBounds = popoverWrapper.element.getBoundingClientRect();

      return expect(popoverBounds.top).toEqual(parentBounds.top + 40);
    });
  });

  xit("should be above when there isn't enough place above or below", function() {
    const height = window.innerHeight;
    createWrapper({
      parentStyle: {
        height: `${height}px`,
        left: '200px',
        position: 'absolute',
        top: '0px',
        width: '100px',
      },
      props: {
        active: true,
      },
      slotStyle: {
        height: '140px',
        width: '140px',
      },
    });
    const popoverWrapper = wrapper.find({ ref: 'popover' });

    return wrapper.vm.$nextTick().then(() => {
      const parentBounds = wrapper.element.getBoundingClientRect();
      const popoverBounds = popoverWrapper.element.getBoundingClientRect();

      return expect(popoverBounds.top).toEqual(parentBounds.top - POPOVER_SHADOW_GAP - 140);
    });
  });

  xit('should update its position on orientation change', function() {
    createWrapper({
      parentStyle: {
        height: '40px',
        left: '200px',
        position: 'absolute',
        top: '200px',
        width: '100px',
      },
      props: {
        active: true,
      },
      slotStyle: {
        height: '140px',
        width: '140px',
      },
    });
    const popoverWrapper = wrapper.find({ ref: 'popover' });

    return wrapper.vm.$nextTick().then(() => {
      wrapper.element.style.left = '100px';
      window.dispatchEvent(new Event('orientationchange'));

      return wrapper.vm.$nextTick().then(() => {
        const parentBounds = wrapper.element.getBoundingClientRect();
        const popoverBounds = popoverWrapper.element.getBoundingClientRect();

        return expect(popoverBounds.left).toEqual(parentBounds.left + (100 - 140) / 2);
      });
    });
  });

  xit('should update its position when resized', function() {
    createWrapper({
      parentStyle: {
        height: '40px',
        left: '200px',
        position: 'absolute',
        top: '200px',
        width: '100px',
      },
      props: {
        active: true,
      },
      slotStyle: {
        height: '140px',
        width: '140px',
      },
    });
    const popoverWrapper = wrapper.find({ ref: 'popover' });

    return wrapper.vm.$nextTick().then(() => {
      wrapper.element.style.left = '100px';
      window.dispatchEvent(new Event('resize'));

      return wrapper.vm.$nextTick().then(() => {
        const parentBounds = wrapper.element.getBoundingClientRect();
        const popoverBounds = popoverWrapper.element.getBoundingClientRect();

        return expect(popoverBounds.left).toEqual(parentBounds.left + (100 - 140) / 2);
      });
    });
  });

  xit('should update its position when scrolled', function() {
    createWrapper({
      parentStyle: {
        height: '40px',
        left: '200px',
        position: 'absolute',
        top: '200px',
        width: '100px',
      },
      props: {
        active: true,
      },
      slotStyle: {
        height: '140px',
        width: '140px',
      },
    });
    const popoverWrapper = wrapper.find({ ref: 'popover' });

    return wrapper.vm.$nextTick().then(() => {
      wrapper.element.style.left = '100px';
      wrapper.element.dispatchEvent(new Event('scroll'));

      return wrapper.vm.$nextTick().then(() => {
        const parentBounds = wrapper.element.getBoundingClientRect();
        const popoverBounds = popoverWrapper.element.getBoundingClientRect();

        return expect(popoverBounds.left).toEqual(parentBounds.left + (100 - 140) / 2);
      });
    });
  });

  xit('should be visible', function() {
    createWrapper({ props: { active: true } });
    const popoverWrapper = wrapper.find({ ref: 'popover' });

    return expect(
      window.getComputedStyle(popoverWrapper.element).getPropertyValue('visibility'),
    ).toEqual('visible');
  });

  xdescribe('when aligned justify', function() {
    beforeEach(function() {
      createWrapper({
        parentStyle: {
          height: '40px',
          left: '200px',
          position: 'absolute',
          top: '200px',
          width: '100px',
        },
        props: {
          active: true,
          align: POPOVER_ALIGN.JUSTIFY,
        },
        slotStyle: {
          height: '140px',
          width: '140px',
        },
      });
    });

    it("should have its parent's width", function() {
      const popoverWrapper = wrapper.find({ ref: 'popover' });

      return wrapper.vm.$nextTick().then(() => {
        return expect(popoverWrapper.element.offsetWidth).toEqual(100);
      });
    });

    it("should have its parent's left position", function() {
      const popoverWrapper = wrapper.find({ ref: 'popover' });

      return wrapper.vm.$nextTick().then(() => {
        const parentBounds = wrapper.element.getBoundingClientRect();
        const popoverBounds = popoverWrapper.element.getBoundingClientRect();

        return expect(popoverBounds.left).toEqual(parentBounds.left);
      });
    });
  });

  xdescribe('when aligned left', function() {
    it('should be aligned left by default', function() {
      createWrapper({
        parentStyle: {
          height: '40px',
          left: '200px',
          position: 'absolute',
          top: '200px',
          width: '100px',
        },
        props: {
          active: true,
          align: POPOVER_ALIGN.LEFT,
        },
        slotStyle: {
          height: '140px',
          width: '140px',
        },
      });
      const popoverWrapper = wrapper.find({ ref: 'popover' });

      return wrapper.vm.$nextTick().then(() => {
        const parentBounds = wrapper.element.getBoundingClientRect();
        const popoverBounds = popoverWrapper.element.getBoundingClientRect();

        return expect(popoverBounds.left).toEqual(parentBounds.left);
      });
    });

    it("should be aligned right when there isn't enough space on right", function() {
      const parentLeft = window.innerWidth - 100;
      createWrapper({
        parentStyle: {
          height: '40px',
          left: `${parentLeft}px`,
          position: 'absolute',
          top: '200px',
          width: '100px',
        },
        props: {
          active: true,
          align: POPOVER_ALIGN.LEFT,
        },
        slotStyle: {
          height: '140px',
          width: '140px',
        },
      });
      const popoverWrapper = wrapper.find({ ref: 'popover' });

      return wrapper.vm.$nextTick().then(() => {
        const parentBounds = wrapper.element.getBoundingClientRect();
        const popoverBounds = popoverWrapper.element.getBoundingClientRect();

        return expect(popoverBounds.left).toEqual(parentBounds.right - 140);
      });
    });

    it("should be aligned left when there isn't enough space on either side", function() {
      createWrapper({
        parentStyle: {
          height: '40px',
          left: '0px',
          position: 'absolute',
          top: '200px',
          width: `${window.innerWidth}px`,
        },
        props: {
          active: true,
          align: POPOVER_ALIGN.LEFT,
        },
        slotStyle: {
          height: '140px',
          width: '140px',
        },
      });
      const popoverWrapper = wrapper.find({ ref: 'popover' });

      return wrapper.vm.$nextTick().then(() => {
        const parentBounds = wrapper.element.getBoundingClientRect();
        const popoverBounds = popoverWrapper.element.getBoundingClientRect();

        return expect(popoverBounds.left).toEqual(parentBounds.left);
      });
    });
  });

  xdescribe('when aligned right', function() {
    it('should be aligned right by default', function() {
      createWrapper({
        parentStyle: {
          height: '40px',
          left: '200px',
          position: 'absolute',
          top: '200px',
          width: '100px',
        },
        props: {
          active: true,
          align: POPOVER_ALIGN.RIGHT,
        },
        slotStyle: {
          height: '140px',
          width: '140px',
        },
      });
      const popoverWrapper = wrapper.find({ ref: 'popover' });

      return wrapper.vm.$nextTick().then(() => {
        const parentBounds = wrapper.element.getBoundingClientRect();
        const popoverBounds = popoverWrapper.element.getBoundingClientRect();

        return expect(popoverBounds.left).toEqual(parentBounds.right - 140);
      });
    });

    it("should be aligned left when there isn't enough space on left", function() {
      createWrapper({
        parentStyle: {
          height: '40px',
          left: '0px',
          position: 'absolute',
          top: '200px',
          width: '100px',
        },
        props: {
          active: true,
          align: POPOVER_ALIGN.RIGHT,
        },
        slotStyle: {
          height: '140px',
          width: '140px',
        },
      });
      const popoverWrapper = wrapper.find({ ref: 'popover' });

      return wrapper.vm.$nextTick().then(() => {
        const parentBounds = wrapper.element.getBoundingClientRect();
        const popoverBounds = popoverWrapper.element.getBoundingClientRect();

        return expect(popoverBounds.left).toEqual(parentBounds.left);
      });
    });

    it("should be aligned right when there isn't enough space on either side", function() {
      createWrapper({
        parentStyle: {
          height: '40px',
          left: '0px',
          position: 'absolute',
          top: '200px',
          width: `${window.innerWidth}px`,
        },
        props: {
          active: true,
          align: POPOVER_ALIGN.RIGHT,
        },
        slotStyle: {
          height: '140px',
          width: '140px',
        },
      });
      const popoverWrapper = wrapper.find({ ref: 'popover' });

      return wrapper.vm.$nextTick().then(() => {
        const parentBounds = wrapper.element.getBoundingClientRect();
        const popoverBounds = popoverWrapper.element.getBoundingClientRect();

        return expect(popoverBounds.left).toEqual(parentBounds.right - 140);
      });
    });
  });

  xdescribe('when bottom', function() {
    it('should be below', function() {
      createWrapper({
        parentStyle: {
          height: '40px',
          left: '200px',
          position: 'absolute',
          top: '200px',
          width: '100px',
        },
        props: {
          active: true,
          bottom: true,
        },
        slotStyle: {
          height: '140px',
          width: '140px',
        },
      });
      const popoverWrapper = wrapper.find({ ref: 'popover' });

      return wrapper.vm.$nextTick().then(() => {
        const parentBounds = wrapper.element.getBoundingClientRect();
        const popoverBounds = popoverWrapper.element.getBoundingClientRect();

        return expect(popoverBounds.top).toEqual(parentBounds.top + 40);
      });
    });

    it("should be above when there isn't enough place below and there is above", function() {
      const parentTop = window.innerHeight - 40;
      createWrapper({
        parentStyle: {
          height: '40px',
          left: '200px',
          position: 'absolute',
          top: `${parentTop}px`,
          width: '100px',
        },
        props: {
          active: true,
          bottom: true,
        },
        slotStyle: {
          height: '140px',
          width: '140px',
        },
      });
      const popoverWrapper = wrapper.find({ ref: 'popover' });

      return wrapper.vm.$nextTick().then(() => {
        const parentBounds = wrapper.element.getBoundingClientRect();
        const popoverBounds = popoverWrapper.element.getBoundingClientRect();

        return expect(popoverBounds.top).toEqual(parentBounds.top - POPOVER_SHADOW_GAP - 140);
      });
    });

    it("should be below when there isn't enough place above or below", function() {
      const height = window.innerHeight;
      createWrapper({
        parentStyle: {
          height: `${height}px`,
          left: '200px',
          position: 'absolute',
          top: '0px',
          width: '100px',
        },
        props: {
          active: true,
          bottom: true,
        },
        slotStyle: {
          height: '140px',
          width: '140px',
        },
      });
      const popoverWrapper = wrapper.find({ ref: 'popover' });

      return wrapper.vm.$nextTick().then(() => {
        const parentBounds = wrapper.element.getBoundingClientRect();
        const popoverBounds = popoverWrapper.element.getBoundingClientRect();

        return expect(popoverBounds.top).toEqual(parentBounds.top + height);
      });
    });
  });
});
