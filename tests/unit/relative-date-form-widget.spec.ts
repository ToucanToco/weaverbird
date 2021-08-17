import { shallowMount, Wrapper } from '@vue/test-utils';

import RelativeDateForm from '@/components/stepforms/widgets/DateComponents/RelativeDateForm.vue';
import { DEFAULT_DURATIONS } from '@/lib/dates';

describe('Relative date form', () => {
  let wrapper: Wrapper<RelativeDateForm>;
  const VARIABLES = [
    {
      label: 'Today',
      identifier: 'today',
    },
    {
      label: 'Last month',
      identifier: 'last_month',
    },
    {
      label: 'This year',
      identifier: 'this_year',
    },
  ];
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
    const value = { quantity: 20, duration: 'today' };
    beforeEach(() => {
      createWrapper({
        availableVariables: VARIABLES,
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
    it('should pass durations options labels to autcomplete', () => {
      expect(wrapper.find('AutocompleteWidget-stub').props().options).toStrictEqual([
        'Today',
        'Last month',
        'This year',
      ]);
    });
    it('should pass quantity to input number', () => {
      expect(wrapper.find('InputNumberWidget-stub').props().value).toBe(20);
    });
    it('should pass duration label to autocomplete', () => {
      expect(wrapper.find('AutocompleteWidget-stub').props().value).toBe('Today');
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
      beforeEach(async () => {
        wrapper.find('AutocompleteWidget-stub').vm.$emit('input', 'Last month');
        await wrapper.vm.$nextTick();
      });
      it('should emit value with updated duration', () => {
        expect(wrapper.emitted().input[0][0]).toStrictEqual({
          ...value,
          duration: 'last_month',
        });
      });
    });
  });

  describe('empty', () => {
    beforeEach(() => {
      createWrapper();
    });
    it('should set availableVariables to default durations', () => {
      expect((wrapper.vm as any).availableVariables).toStrictEqual(DEFAULT_DURATIONS);
    });
    it('should set value to empty object', () => {
      expect((wrapper.vm as any).value).toStrictEqual({
        quantity: 1,
        duration: DEFAULT_DURATIONS[0].label,
      });
    });
    it('should set quantity to 1', () => {
      expect(wrapper.find('InputNumberWidget-stub').props().value).toBe(1);
    });
    it('should set duration to first default duration', () => {
      expect(wrapper.find('AutocompleteWidget-stub').props().value).toBe(
        DEFAULT_DURATIONS[0].label,
      );
    });
  });
});
