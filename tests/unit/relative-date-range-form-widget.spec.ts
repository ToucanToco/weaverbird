import { shallowMount, Wrapper } from '@vue/test-utils';

import RelativeDateRangeForm from '@/components/stepforms/widgets/DateComponents/RelativeDateRangeForm.vue';

const SAMPLE_VARIABLES = [
  { label: 'Today', identifier: 'today' },
  { label: 'Tomorrow', identifier: 'tomorrow' },
  { label: 'Next month', identifier: 'newt_month' },
];

describe('Relative date range form', () => {
  let wrapper: Wrapper<RelativeDateRangeForm>;
  const createWrapper = (propsData: any = {}) => {
    wrapper = shallowMount(RelativeDateRangeForm, {
      sync: false,
      propsData,
    });
  };

  afterEach(() => {
    if (wrapper) wrapper.destroy();
  });

  describe('default', () => {
    const date = '{{today}}';
    beforeEach(() => {
      createWrapper({
        value: { date, quantity: -1, duration: 'month' },
        variableDelimiters: { start: '{{', end: '}}' },
        availableVariables: SAMPLE_VARIABLES,
      });
    });
    it('should instantiate', () => {
      expect(wrapper.exists()).toBe(true);
    });
    it('should pass option referring to date value to baseDate input', () => {
      expect(
        wrapper.find('.widget-relative-date-range-form__input--base-date').props().value,
      ).toStrictEqual({
        identifier: 'today',
        label: 'Today',
      });
    });
    it('should pass relative date part of value to rangeSize (relative date form) input', () => {
      expect(wrapper.find('RelativeDateForm-stub').props().value).toStrictEqual({
        quantity: -1,
        duration: 'month',
      });
    });
    it('should pass corresponding direction to rangeDirection input', () => {
      expect(
        wrapper.find('.widget-relative-date-range-form__input--direction').props().value,
      ).toStrictEqual({ label: 'before', value: 'before' });
    });

    describe('when baseDate is updated', () => {
      const selectedDateVariable = SAMPLE_VARIABLES[1];
      beforeEach(async () => {
        wrapper
          .find('.widget-relative-date-range-form__input--base-date')
          .vm.$emit('input', selectedDateVariable);
        await wrapper.vm.$nextTick();
      });
      it('should emit value with updated date with delimiters', () => {
        const newDate = `{{${selectedDateVariable.identifier}}}`;
        expect(wrapper.emitted().input[0][0]).toStrictEqual({
          date: newDate,
          quantity: -1,
          duration: 'month',
        });
      });
    });

    describe('when rangeSize is updated', () => {
      beforeEach(async () => {
        wrapper
          .find('RelativeDateForm-stub')
          .vm.$emit('input', { date, quantity: -2, duration: 'year' });
        await wrapper.vm.$nextTick();
      });
      it('should emit value with updated rangeSize', () => {
        expect(wrapper.emitted().input[0][0]).toStrictEqual({
          date,
          quantity: -2,
          duration: 'year',
        });
      });
    });
  });

  describe('empty', () => {
    beforeEach(() => {
      createWrapper();
    });
    it('should initiate value', () => {
      expect((wrapper.vm as any).value).toStrictEqual({ date: '', quantity: -1, duration: 'year' });
    });
    it('should set available variables to empty array', () => {
      expect(
        wrapper.find('.widget-relative-date-range-form__input--base-date').props().options,
      ).toStrictEqual([]);
    });
    it('should set variable delimiters to empty strings', () => {
      expect((wrapper.vm as any).variableDelimiters).toStrictEqual({ start: '', end: '' });
    });
    it('should pass empty string as value to baseDate input', () => {
      expect(
        wrapper.find('.widget-relative-date-range-form__input--base-date').props().value,
      ).toStrictEqual('');
    });
    it('should pass "before" as default value to rangeDirection input', () => {
      expect(
        wrapper.find('.widget-relative-date-range-form__input--direction').props().value,
      ).toStrictEqual({ label: 'before', value: 'before' });
    });
  });
});
