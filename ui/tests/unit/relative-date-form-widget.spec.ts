import { shallowMount, Wrapper } from '@vue/test-utils';

import RelativeDateForm from '@/components/stepforms/widgets/DateComponents/RelativeDateForm.vue';

const SAMPLE_VARIABLES = [
  { label: 'Today', identifier: 'today' },
  { label: 'Tomorrow', identifier: 'tomorrow' },
  { label: 'Next month', identifier: 'newt_month' },
];

describe('RelativeDate form', () => {
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
    const date = '{{today}}';
    beforeEach(() => {
      createWrapper({
        value: { date, quantity: 1, duration: 'month', operator: 'until' },
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
    it('should pass relative date part of value to quantity & duration input', () => {
      expect(
        wrapper.find('.widget-relative-date-range-form__quantity').props('value'),
      ).toStrictEqual(1);
      expect(
        wrapper.find('.widget-relative-date-range-form__duration').props('value'),
      ).toStrictEqual({ label: 'Months', value: 'month' });
    });
    it('should pass corresponding direction to operator input', () => {
      expect(
        wrapper.find('.widget-relative-date-range-form__input--operator').props().value,
      ).toStrictEqual({ label: 'until', sign: -1 });
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
          quantity: 1,
          duration: 'month',
          operator: 'until',
        });
      });
    });

    describe('when quantity is updated', () => {
      beforeEach(async () => {
        wrapper.find('.widget-relative-date-range-form__quantity').vm.$emit('input', 2);
        await wrapper.vm.$nextTick();
      });
      it('should emit value with updated quantity and the right sign', () => {
        expect(wrapper.emitted().input[0][0]).toStrictEqual({
          date,
          quantity: 2,
          duration: 'month',
          operator: 'until',
        });
      });
    });

    describe('when duration is updated', () => {
      beforeEach(async () => {
        wrapper
          .find('.widget-relative-date-range-form__duration')
          .vm.$emit('input', { label: 'Years', value: 'year' });
        await wrapper.vm.$nextTick();
      });
      it('should emit value with updated duration', () => {
        expect(wrapper.emitted().input[0][0]).toStrictEqual({
          date,
          quantity: 1,
          duration: 'year',
          operator: 'until',
        });
      });
    });

    describe('when operator is updated', () => {
      beforeEach(async () => {
        wrapper
          .find('.widget-relative-date-range-form__input--operator')
          .vm.$emit('input', { label: 'from', sign: +1 });
        await wrapper.vm.$nextTick();
      });
      it('should emit value with updated operator', () => {
        expect(wrapper.emitted().input[0][0]).toStrictEqual({
          date,
          quantity: 1,
          duration: 'month',
          operator: 'from',
        });
      });
    });
  });

  describe('empty', () => {
    beforeEach(() => {
      createWrapper();
    });
    it('should initiate value', () => {
      expect((wrapper.vm as any).value).toStrictEqual({
        date: '',
        quantity: 1,
        duration: 'year',
        operator: 'until',
      });
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
    it('should pass "until" as default value to operator input', () => {
      expect(
        wrapper.find('.widget-relative-date-range-form__input--operator').props().value,
      ).toStrictEqual({ label: 'until', sign: -1 });
    });
  });
});
