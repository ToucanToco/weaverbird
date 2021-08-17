import { shallowMount, Wrapper } from '@vue/test-utils';

import RelativeDateForm from '@/components/stepforms/widgets/DateComponents/RelativeDateForm.vue';
import { DEFAULT_DURATIONS } from '@/lib/dates';

describe('Relative date form', () => {
  let wrapper: Wrapper<RelativeDateForm>;
  const createWrapper = (propsData: any = {}) => {
    wrapper = shallowMount(RelativeDateForm, {
      sync: false,
      propsData,
    });
  };

  afterEach(() => {
    if (wrapper) wrapper.destroy();
  });

  describe('default', () => {
    const selectedDuration = DEFAULT_DURATIONS[1];
    const value = { quantity: 20, duration: selectedDuration.value };
    beforeEach(() => {
      createWrapper({
        value,
      });
    });
    it('should instantiate', () => {
      expect(wrapper.exists()).toBe(true);
    });
    it('should use a number input', () => {
      expect(wrapper.find('InputNumberWidget-stub').exists()).toBe(true);
    });
    it('should use an autocomplete input', () => {
      expect(wrapper.find('AutocompleteWidget-stub').exists()).toBe(true);
    });
    it('should pass durations options to autcomplete', () => {
      expect(wrapper.find('AutocompleteWidget-stub').props().options).toStrictEqual(
        DEFAULT_DURATIONS,
      );
    });
    it('should pass quantity to input number', () => {
      expect(wrapper.find('InputNumberWidget-stub').props().value).toBe(20);
    });
    it('should pass duration label to autocomplete', () => {
      expect(wrapper.find('AutocompleteWidget-stub').props().value).toBe(selectedDuration);
    });

    describe('when quantity is updated', () => {
      beforeEach(async () => {
        wrapper.find('InputNumberWidget-stub').vm.$emit('input', 3);
        await wrapper.vm.$nextTick();
      });
      it('should emit value with updated quantity', () => {
        expect(wrapper.emitted().input[0][0]).toStrictEqual({
          ...value,
          quantity: 3,
        });
      });
    });

    describe('when duration is updated', () => {
      const selectedDuration = DEFAULT_DURATIONS[2];
      beforeEach(async () => {
        wrapper.find('AutocompleteWidget-stub').vm.$emit('input', selectedDuration);
        await wrapper.vm.$nextTick();
      });
      it('should emit value with updated duration', () => {
        expect(wrapper.emitted().input[0][0]).toStrictEqual({
          ...value,
          duration: selectedDuration.value,
        });
      });
    });
  });

  describe('empty', () => {
    const defaultDuration = DEFAULT_DURATIONS[0];
    beforeEach(() => {
      createWrapper();
    });
    it('should set value to empty object', () => {
      expect((wrapper.vm as any).value).toStrictEqual({
        quantity: 1,
        duration: defaultDuration.value,
      });
    });
    it('should set quantity to 1', () => {
      expect(wrapper.find('InputNumberWidget-stub').props().value).toBe(1);
    });
    it('should set duration to first default duration', () => {
      expect(wrapper.find('AutocompleteWidget-stub').props().value).toBe(defaultDuration);
    });
  });
});
