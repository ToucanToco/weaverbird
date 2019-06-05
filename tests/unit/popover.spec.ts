import _ from 'lodash';
import { expect } from 'chai';
import sinon from 'sinon';
import { mount, Wrapper } from '@vue/test-utils';
import Vue from 'vue';

import Popover from '@/components/Popover.vue';
import { POPOVER_ALIGN, POPOVER_SHADOW_GAP } from '@/components/constants';

describe('Popover', function() {
  var wrapper: Wrapper<Vue>;
  var popoverWrapper: Wrapper<Vue>;
  var clock = sinon.useFakeTimers();

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
    clock.tick(16);
  };

  beforeEach(function() {
    clock = sinon.useFakeTimers();
  });

  afterEach(function() {
    wrapper.destroy();
    clock.restore();
  });

  it('should instanciate a popover', function() {
    createWrapper();
    expect(_.isElement(popoverWrapper.element)).to.be.true;
  });

  it('should include the passed slot content', function() {
    createWrapper({ slotText: 'Lorem ipsum' });
    const slotContentWrapper = popoverWrapper.find('.slot-content');

    expect(slotContentWrapper.exists()).to.be.true;
    expect(slotContentWrapper.text()).to.equal('Lorem ipsum');
  });

  it('should append itself to the document body', function() {
    createWrapper();

    expect(popoverWrapper.element.parentElement).to.eql(document.body);
  });

  it('should remove its DOM upon destruction', function() {
    createWrapper();
    popoverWrapper.destroy();

    expect(document.body.querySelector('.tc-popover')).to.be.null;
  });

  it('should be hidden by default', function() {
    createWrapper();
    expect(popoverWrapper.classes()).to.eql(['popover']);
  });

  describe('when active', function() {
    it('should be above by default', async function() {
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
      await wrapper.vm.$nextTick();
      const parentBounds = wrapper.element.getBoundingClientRect();
      const popoverBounds = popoverWrapper.element.getBoundingClientRect();

      expect(popoverBounds.top).to.equal(parentBounds.top - POPOVER_SHADOW_GAP - 140);
    });

    it('should be centered by default', async function() {
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

      await wrapper.vm.$nextTick();
      const parentBounds = wrapper.element.getBoundingClientRect();
      const popoverBounds = popoverWrapper.element.getBoundingClientRect();
      expect(popoverBounds.left).to.equal(parentBounds.left + (100 - 140) / 2);
    });
  });

  it("should be aligned left when there isn't enough space on left", async function() {
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

    await wrapper.vm.$nextTick();
    const parentBounds = wrapper.element.getBoundingClientRect();
    const popoverBounds = popoverWrapper.element.getBoundingClientRect();

    expect(popoverBounds.left).to.equal(parentBounds.left);
  });

  it("should be aligned right when there isn't enough space on right", async function() {
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

    await wrapper.vm.$nextTick();
    const parentBounds = wrapper.element.getBoundingClientRect();
    const popoverBounds = popoverWrapper.element.getBoundingClientRect();

    expect(popoverBounds.left).to.equal(parentBounds.right - 140);
  });

  it("should be below when there isn't enough place above and there is below", async function() {
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

    await wrapper.vm.$nextTick();
    const parentBounds = wrapper.element.getBoundingClientRect();
    const popoverBounds = popoverWrapper.element.getBoundingClientRect();

    expect(popoverBounds.top).to.equal(parentBounds.top + 40);
  });

  xit("should be above when there isn't enough place above or below", async function() {
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

    await wrapper.vm.$nextTick();
    const parentBounds = wrapper.element.getBoundingClientRect();
    const popoverBounds = popoverWrapper.element.getBoundingClientRect();

    expect(popoverBounds.top).to.equal(parentBounds.top - POPOVER_SHADOW_GAP - 140);
  });

  it('should update its position on orientation change', async function() {
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

    await wrapper.vm.$nextTick();
    wrapper.element.style.left = '100px';
    window.dispatchEvent(new Event('orientationchange'));

    await wrapper.vm.$nextTick();
    const parentBounds = wrapper.element.getBoundingClientRect();
    const popoverBounds = popoverWrapper.element.getBoundingClientRect();

    expect(popoverBounds.left).to.equal(parentBounds.left + (100 - 140) / 2);
  });

  it('should update its position when resized', async function() {
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

    await wrapper.vm.$nextTick();
    wrapper.element.style.left = '100px';
    window.dispatchEvent(new Event('resize'));

    await wrapper.vm.$nextTick();
    const parentBounds = wrapper.element.getBoundingClientRect();
    const popoverBounds = popoverWrapper.element.getBoundingClientRect();

    expect(popoverBounds.left).to.equal(parentBounds.left + (100 - 140) / 2);
  });

  it('should update its position when scrolled', async function() {
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

    await wrapper.vm.$nextTick();
    wrapper.element.style.left = '100px';
    wrapper.element.dispatchEvent(new Event('scroll'));

    await wrapper.vm.$nextTick();
    const parentBounds = wrapper.element.getBoundingClientRect();
    const popoverBounds = popoverWrapper.element.getBoundingClientRect();

    expect(popoverBounds.left).to.equal(parentBounds.left + (100 - 140) / 2);
  });

  it('should be visible', function() {
    createWrapper({ props: { active: true } });
    const popoverWrapper = wrapper.find({ ref: 'popover' });

    expect(window.getComputedStyle(popoverWrapper.element).getPropertyValue('visibility')).to.equal(
      'visible',
    );
  });

  describe('when aligned justify', function() {
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

    it("should have its parent's width", async function() {
      const popoverWrapper = wrapper.find({ ref: 'popover' });

      await wrapper.vm.$nextTick();
      expect(popoverWrapper.element.offsetWidth).to.equal(100);
    });

    it("should have its parent's left position", async function() {
      const popoverWrapper = wrapper.find({ ref: 'popover' });

      await wrapper.vm.$nextTick();
      const parentBounds = wrapper.element.getBoundingClientRect();
      const popoverBounds = popoverWrapper.element.getBoundingClientRect();

      expect(popoverBounds.left).to.equal(parentBounds.left);
    });
  });

  describe('when aligned left', function() {
    it('should be aligned left by default', async function() {
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

      await wrapper.vm.$nextTick();
      const parentBounds = wrapper.element.getBoundingClientRect();
      const popoverBounds = popoverWrapper.element.getBoundingClientRect();

      expect(popoverBounds.left).to.equal(parentBounds.left);
    });

    it("should be aligned right when there isn't enough space on right", async function() {
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

      await wrapper.vm.$nextTick();
      const parentBounds = wrapper.element.getBoundingClientRect();
      const popoverBounds = popoverWrapper.element.getBoundingClientRect();

      expect(popoverBounds.left).to.equal(parentBounds.right - 140);
    });

    it("should be aligned left when there isn't enough space on either side", async function() {
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

      await wrapper.vm.$nextTick();
      const parentBounds = wrapper.element.getBoundingClientRect();
      const popoverBounds = popoverWrapper.element.getBoundingClientRect();

      expect(popoverBounds.left).to.equal(parentBounds.left);
    });
  });

  describe('when aligned right', function() {
    it('should be aligned right by default', async function() {
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

      await wrapper.vm.$nextTick();
      const parentBounds = wrapper.element.getBoundingClientRect();
      const popoverBounds = popoverWrapper.element.getBoundingClientRect();

      expect(popoverBounds.left).to.equal(parentBounds.right - 140);
    });

    it("should be aligned left when there isn't enough space on left", async function() {
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

      await wrapper.vm.$nextTick();
      const parentBounds = wrapper.element.getBoundingClientRect();
      const popoverBounds = popoverWrapper.element.getBoundingClientRect();

      expect(popoverBounds.left).to.equal(parentBounds.left);
    });

    it("should be aligned right when there isn't enough space on either side", async function() {
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

      await wrapper.vm.$nextTick();
      const parentBounds = wrapper.element.getBoundingClientRect();
      const popoverBounds = popoverWrapper.element.getBoundingClientRect();

      expect(popoverBounds.left).to.equal(parentBounds.right - 140);
    });
  });

  describe('when bottom', function() {
    it('should be below', async function() {
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

      await wrapper.vm.$nextTick();
      const parentBounds = wrapper.element.getBoundingClientRect();
      const popoverBounds = popoverWrapper.element.getBoundingClientRect();

      expect(popoverBounds.top).to.equal(parentBounds.top + 40);
    });

    it("should be above when there isn't enough place below and there is above", async function() {
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

      await wrapper.vm.$nextTick();
      const parentBounds = wrapper.element.getBoundingClientRect();
      const popoverBounds = popoverWrapper.element.getBoundingClientRect();

      expect(popoverBounds.top).to.equal(parentBounds.top - POPOVER_SHADOW_GAP - 140);
    });

    it("should be below when there isn't enough place above or below", async function() {
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

      await wrapper.vm.$nextTick();
      const parentBounds = wrapper.element.getBoundingClientRect();
      const popoverBounds = popoverWrapper.element.getBoundingClientRect();

      expect(popoverBounds.top).to.equal(parentBounds.top + height);
    });
  });
});
