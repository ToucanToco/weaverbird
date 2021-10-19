import { shallowMount, Wrapper } from '@vue/test-utils';

import DateRangeInput from '@/components/stepforms/widgets/DateComponents/DateRangeInput.vue';
import {
  CUSTOM_DATE_RANGE_LABEL_SEPARATOR,
  dateRangeToString,
  isDateRange,
  RelativeDateRange,
  relativeDateRangeToString,
} from '@/lib/dates';

jest.mock('@/components/FAIcon.vue');

const SAMPLE_VARIABLES = [
  {
    identifier: 'dates.last_7_days',
    label: 'Last 7 days',
    value: '',
  },
  {
    identifier: 'dates.last_14_days',
    label: 'Last 14 days',
    value: { start: new Date(2020, 11), end: new Date(2020, 11) },
  },
  {
    identifier: 'dates.last_30_days',
    label: 'Last 30 days',
    value: '',
  },
  {
    identifier: 'dates.last_3_months',
    label: 'Last 3 Months',
    value: '',
  },
  {
    identifier: 'dates.last_12_months',
    label: 'Last 12 Months',
    value: '',
  },
  {
    identifier: 'dates.month_to_date',
    label: 'Month to date',
    value: '',
  },
  {
    identifier: 'dates.quarter_to_date',
    label: 'Quarter to date',
    value: '',
  },
  {
    identifier: 'dates.all_time',
    label: 'All time',
    value: '',
  },
];

const RELATIVE_SAMPLE_VARIABLES = [
  {
    label: 'Today',
    identifier: 'today',
    value: new Date(2020, 11),
  },
  {
    label: 'Last month',
    identifier: 'last_month',
    value: '',
  },
  {
    label: 'Last year',
    identifier: 'last_year',
    value: '',
  },
];

describe('Date range input', () => {
  let wrapper: Wrapper<DateRangeInput>;
  const createWrapper = (propsData = {}) => {
    wrapper = shallowMount(DateRangeInput, {
      sync: false,
      propsData,
    });
  };

  afterEach(() => {
    if (wrapper) wrapper.destroy();
  });

  describe('default', () => {
    beforeEach(() => {
      createWrapper({
        availableVariables: SAMPLE_VARIABLES,
        relativeAvailableVariables: RELATIVE_SAMPLE_VARIABLES,
        variableDelimiters: { start: '{{', end: '}}' },
        value: 'anythingnotokay',
      });
    });

    it('should instantiate', () => {
      expect(wrapper.exists()).toBe(true);
    });

    it('should display placeholder input label', () => {
      expect(wrapper.find('.widget-date-input__label').text()).toStrictEqual('Select a date');
    });

    it('should have a popover for editor', () => {
      expect(wrapper.find('popover-stub').exists()).toBe(true);
    });

    it('should hide editor by default', () => {
      expect(wrapper.find('popover-stub').props().visible).toBe(false);
    });

    it('should have a CustomVariableList', () => {
      expect(wrapper.find('CustomVariableList-stub').exists()).toBe(true);
    });

    it('should pass available variables to CustomVariableList', () => {
      expect(wrapper.find('CustomVariableList-stub').props().availableVariables).toStrictEqual(
        SAMPLE_VARIABLES,
      );
    });

    describe('when clicking on calendar button', () => {
      beforeEach(async () => {
        wrapper.find('.widget-date-input__button').trigger('click');
        await wrapper.vm.$nextTick();
      });
      it('should show editor', () => {
        expect(wrapper.find('popover-stub').props().visible).toBe(true);
      });
    });

    describe('when selecting a variable in CustomVariableList', () => {
      const selectedVariable = SAMPLE_VARIABLES[1].identifier;
      beforeEach(async () => {
        wrapper.find('CustomVariableList-stub').vm.$emit('input', selectedVariable);
        await wrapper.vm.$nextTick();
      });
      it('should emit the selected variable identifier with delimiters', () => {
        expect(wrapper.emitted().input[0][0]).toBe(`{{${selectedVariable}}}`);
      });
      it('should hide editor', () => {
        expect(wrapper.find('popover-stub').props().visible).toBe(false);
      });
    });

    describe('when selecting "custom" in CustomVariableList', () => {
      beforeEach(async () => {
        wrapper.find('CustomVariableList-stub').vm.$emit('selectCustomVariable');
        await wrapper.vm.$nextTick();
      });
      it('should use "custom" as selected variable', () => {
        expect(wrapper.find('CustomVariableList-stub').props().selectedVariables).toStrictEqual(
          'custom',
        );
      });
      it('should show custom editor', () => {
        expect(wrapper.find({ ref: 'custom-editor' }).isVisible()).toBe(true);
      });
      it('should force popover to update position to always display custom editor in visible part of screen', () => {
        expect(wrapper.find('.widget-date-input__editor').props().forcePositionUpdate).toBe(1);
      });
    });
  });

  describe('custom editor', () => {
    beforeEach(() => {
      createWrapper({
        availableVariables: SAMPLE_VARIABLES,
        relativeAvailableVariables: RELATIVE_SAMPLE_VARIABLES,
        variableDelimiters: { start: '{{', end: '}}' },
      });
    });

    it('should have a Tabs', () => {
      expect(wrapper.find('Tabs-stub').exists()).toBe(true);
    });

    it('should have two tabs and a selected tabs by default', () => {
      expect(wrapper.find('Tabs-stub').props().tabs).toStrictEqual(['Relative', 'Fixed']);
      expect(wrapper.find('Tabs-stub').props().selectedTab).not.toBeUndefined();
    });

    describe('when clicking on cancel button', () => {
      beforeEach(async () => {
        wrapper.find({ ref: 'cancel' }).trigger('click');
        await wrapper.vm.$nextTick();
      });

      it('should close the editor', () => {
        expect(wrapper.find('popover-stub').props().visible).toBe(false);
      });
    });

    describe('when clicking on save button', () => {
      const editedValue: RelativeDateRange = { date: '{{today}}', quantity: -1, duration: 'month' };

      beforeEach(async () => {
        wrapper.find('RelativeDateRangeForm-stub').vm.$emit('input', editedValue);
        await wrapper.vm.$nextTick();
        wrapper.find({ ref: 'save' }).trigger('click');
        await wrapper.vm.$nextTick();
      });
      it('should emit current tab value', () => {
        expect(wrapper.emitted().input[0][0]).toStrictEqual(editedValue);
      });
    });

    describe('when selecting "Fixed" tab', () => {
      beforeEach(async () => {
        wrapper.find('Tabs-stub').vm.$emit('tabSelected', 'Fixed');
        await wrapper.vm.$nextTick();
      });
      it('should display correct body component', () => {
        expect(wrapper.find('TabbedRangeCalendars-stub').exists()).toBe(true);
        expect(wrapper.find('RelativeDateRangeForm-stub').exists()).toBe(false);
      });
      it('should have a disabled save button', () => {
        expect(wrapper.find({ ref: 'save' }).attributes('disabled')).toBe('disabled');
      });

      describe('when updating TabbedRangeCalendars value', () => {
        const newValue = { start: new Date(8), end: new Date(11) };
        beforeEach(async () => {
          wrapper.find('TabbedRangeCalendars-stub').vm.$emit('input', newValue);
          await wrapper.vm.$nextTick();
        });
        it('should update tab value', () => {
          expect((wrapper.vm as any).currentTabValue).toStrictEqual(newValue);
        });
        it('should have an enabled save button', () => {
          expect(wrapper.find({ ref: 'save' }).attributes('disabled')).not.toBe('disabled');
        });
      });
    });

    describe('choose right selected tab when opening calendar', () => {
      const initialValue: RelativeDateRange = { date: '{{today}}', quantity: 1, duration: 'month' };
      const updatedValue = { start: new Date(), end: new Date(1) };
      beforeEach(async () => {
        createWrapper({
          availableVariables: SAMPLE_VARIABLES,
          relativeAvailableVariables: RELATIVE_SAMPLE_VARIABLES,
          variableDelimiters: { start: '{{', end: '}}' },
          value: initialValue,
        });
        await wrapper.setProps({
          value: updatedValue,
        });
        await wrapper.find('.widget-date-input__button').trigger('click');
      });
      it('should select "Fixed" tab by default', () => {
        expect(wrapper.find('Tabs-stub').props().selectedTab).toBe('Fixed');
      });
    });

    describe('when selecting "Relative" tab', () => {
      beforeEach(async () => {
        wrapper.find('Tabs-stub').vm.$emit('tabSelected', 'Relative');
        await wrapper.vm.$nextTick();
      });
      it('should display correct body component', () => {
        expect(wrapper.find('RelativeDateRangeForm-stub').exists()).toBe(true);
        expect(wrapper.find('TabbedRangeCalendars-stub').exists()).toBe(false);
      });
      it('should have a disabled save button', () => {
        expect(wrapper.find({ ref: 'save' }).attributes('disabled')).toBe('disabled');
      });

      describe('when updating RelativeDateRangeForm value', () => {
        const newValue = { date: '{{today}}', quantity: -1, duration: 'month' };
        beforeEach(async () => {
          wrapper.find('RelativeDateRangeForm-stub').vm.$emit('input', newValue);
          await wrapper.vm.$nextTick();
        });
        it('should update tab value', () => {
          expect((wrapper.vm as any).currentTabValue).toStrictEqual(newValue);
        });
        it('should have an enabled save button', () => {
          expect(wrapper.find({ ref: 'save' }).attributes('disabled')).not.toBe('disabled');
        });
      });
    });

    describe('when switching between tabs', () => {
      const updatedRelativeDateValue = { date: '{{today}}', quantity: -1, duration: 'month' };
      beforeEach(async () => {
        wrapper.find('RelativeDateRangeForm-stub').vm.$emit('input', updatedRelativeDateValue); // update RelativeDateRangeForm value
        await wrapper.vm.$nextTick();
        wrapper.find('Tabs-stub').vm.$emit('tabSelected', 'Fixed'); // switching to the other tab
        await wrapper.vm.$nextTick();
        wrapper.find('Tabs-stub').vm.$emit('tabSelected', 'Relative'); // come back to previous tab
      });
      it('should not remove other tab value', () => {
        expect(wrapper.find('RelativeDateRangeForm-stub').props().value).toBe(
          updatedRelativeDateValue,
        );
      });
    });
  });

  describe('with selected value as variable', () => {
    const selectedVariable = SAMPLE_VARIABLES[SAMPLE_VARIABLES.length - 1];
    beforeEach(() => {
      createWrapper({
        availableVariables: SAMPLE_VARIABLES,
        variableDelimiters: { start: '{{', end: '}}' },
        value: `{{${selectedVariable.identifier}}}`,
      });
    });
    it('should display variable label as input label', () => {
      expect(wrapper.find('.widget-date-input__label').text()).toStrictEqual(
        selectedVariable.label,
      );
    });
    it('should pass selected variable identifier to CustomVariableList', () => {
      expect(wrapper.find('CustomVariableList-stub').props().selectedVariables).toStrictEqual(
        selectedVariable.identifier,
      );
    });
  });

  describe('with selected value as custom date range', () => {
    const value = { start: new Date(), end: new Date(1) };
    beforeEach(() => {
      createWrapper({
        availableVariables: SAMPLE_VARIABLES,
        variableDelimiters: { start: '{{', end: '}}' },
        value,
      });
    });

    it('should display readable input label', () => {
      const labelWithoutSeparator = dateRangeToString(value).split(
        CUSTOM_DATE_RANGE_LABEL_SEPARATOR,
      ); // due to utf8 char we need to split label
      expect(wrapper.find('.widget-date-input__label').text()).toContain(labelWithoutSeparator[0]);
      expect(wrapper.find('.widget-date-input__label').text()).toContain(labelWithoutSeparator[1]);
    });

    it('should select "Fixed" tab by default', () => {
      expect(wrapper.find('Tabs-stub').props().selectedTab).toBe('Fixed');
    });

    it('should preselect value in TabbedRangeCalendars', () => {
      expect(wrapper.find('TabbedRangeCalendars-stub').props().value).toStrictEqual(value);
    });
    it('should have an enabled save button', () => {
      expect(wrapper.find({ ref: 'save' }).attributes('disabled')).not.toBe('disabled');
    });
  });

  describe('with selected value as relative date', () => {
    const value: RelativeDateRange = { date: '{{today}}', quantity: 1, duration: 'month' };
    beforeEach(() => {
      createWrapper({
        availableVariables: SAMPLE_VARIABLES,
        relativeAvailableVariables: RELATIVE_SAMPLE_VARIABLES,
        variableDelimiters: { start: '{{', end: '}}' },
        value,
      });
    });

    it('should display readable input label', () => {
      const labelWithoutSeparator = relativeDateRangeToString(value, RELATIVE_SAMPLE_VARIABLES, {
        start: '{{',
        end: '}}',
      }).split(CUSTOM_DATE_RANGE_LABEL_SEPARATOR); // due to utf8 char we need to split label
      expect(wrapper.find('.widget-date-input__label').text()).toContain(labelWithoutSeparator[0]);
      expect(wrapper.find('.widget-date-input__label').text()).toContain(labelWithoutSeparator[1]);
    });

    it('should select "Relative" tab by default', () => {
      expect(wrapper.find('Tabs-stub').props().selectedTab).toBe('Relative');
    });
    it('should pass relative available variables to RelativeDateRangeForm', () => {
      expect(wrapper.find('RelativeDateRangeForm-stub').props().availableVariables).toStrictEqual(
        RELATIVE_SAMPLE_VARIABLES,
      );
    });
    it('should preselect value in RelativeDateRangeForm', () => {
      expect(wrapper.find('RelativeDateRangeForm-stub').props().value).toStrictEqual(value);
    });
    it('should have an enabled save button', () => {
      expect(wrapper.find({ ref: 'save' }).attributes('disabled')).not.toBe('disabled');
    });
  });

  describe('with relative date disabled', () => {
    beforeEach(() => {
      createWrapper({
        availableVariables: SAMPLE_VARIABLES,
        variableDelimiters: { start: '{{', end: '}}' },
        enableRelativeDate: false,
      });
    });
    it('should have no tabs', () => {
      expect(wrapper.find('Tabs-stub').exists()).toBe(false);
    });
    it('should always use "Fixed" as selected tab', () => {
      expect(wrapper.find('TabbedRangeCalendars-stub').exists()).toBe(true);
    });
    it('should pass down disabled relative date props to custom variable list', () => {
      expect(wrapper.find('CustomVariableList-stub').props().enableRelativeDate).toBe(false);
    });
  });

  describe('with disabled custom selection', () => {
    beforeEach(() => {
      createWrapper({
        availableVariables: SAMPLE_VARIABLES,
        variableDelimiters: { start: '{{', end: '}}' },
        enableCustom: false,
      });
    });
    it('should not display Custom editor', () => {
      expect(wrapper.find({ ref: 'custom-editor' }).exists()).toBe(false);
    });
    it('should pass down disabled custom selection props to custom variable list', () => {
      expect(wrapper.find('CustomVariableList-stub').props().enableCustom).toBe(false);
    });
  });

  describe('without accessible variables', () => {
    beforeEach(async () => {
      createWrapper({
        availableVariables: [{ label: 'Hidden', identifier: 'hidden', category: 'hidden' }],
        variableDelimiters: { start: '{{', end: '}}' },
      });
      wrapper.find('.widget-date-input__button').trigger('click');
      await wrapper.vm.$nextTick();
    });
    it('should display Custom editor directly when clicking on open button', () => {
      expect(wrapper.find({ ref: 'custom-editor' }).isVisible()).toBe(true);
    });
    it('should not display Custom variable list', () => {
      expect(wrapper.find('CustomVariableList-stub').exists()).toBe(false);
    });
  });

  describe('with hidden variables', () => {
    beforeEach(async () => {
      createWrapper({
        availableVariables: [
          { label: 'Hidden', identifier: 'hidden', category: 'hidden' },
          { label: 'Available', identifier: 'available' },
        ],
        bounds: '{{hidden}}', // hidden variables can be used as variable reference for bounds or presets
        variableDelimiters: { start: '{{', end: '}}' },
      });
      wrapper.find('.widget-date-input__button').trigger('click');
      await wrapper.vm.$nextTick();
    });
    it('should only display accessible variables in UI', () => {
      expect(wrapper.find('CustomVariableList-stub').props().availableVariables).toStrictEqual([
        { label: 'Available', identifier: 'available' },
      ]);
    });
  });

  describe('with bounds', () => {
    const bounds: RelativeDateRange = { date: '{{today}}', quantity: 1, duration: 'month' };
    beforeEach(() => {
      createWrapper({
        availableVariables: SAMPLE_VARIABLES,
        relativeAvailableVariables: RELATIVE_SAMPLE_VARIABLES,
        variableDelimiters: { start: '{{', end: '}}' },
        value: { start: new Date('2020/2/1'), end: new Date('2020/3/1') },
        bounds,
      });
    });
    it('should pass bounds as date range to TabbedRangeCalendars', () => {
      const bounds = wrapper.find('TabbedRangeCalendars-stub').props().bounds;
      expect(bounds).not.toBeUndefined();
      expect(isDateRange(bounds)).toBe(true);
    });
  });

  describe('always open (preview mode)', () => {
    beforeEach(() => {
      createWrapper({
        availableVariables: SAMPLE_VARIABLES,
        alwaysOpen: true,
      });
    });

    it('should show the editor', () => {
      expect(wrapper.find('popover-stub').props().visible).toBe(true);
    });

    describe('when selecting a value', () => {
      beforeEach(async () => {
        wrapper.find('CustomVariableList-stub').vm.$emit('input', SAMPLE_VARIABLES[1].identifier);
        await wrapper.vm.$nextTick();
      });

      it('should still show the editor', () => {
        expect(wrapper.find('popover-stub').props().visible).toBe(true);
      });
    });
  });

  describe('empty', () => {
    beforeEach(() => {
      createWrapper();
    });
    it('should set availableVariables to empty array', () => {
      expect((wrapper.vm as any).availableVariables).toStrictEqual([]);
    });
    it('should set relativeAvailableVariables to empty array', () => {
      expect(wrapper.find('RelativeDateRangeForm-stub').props().availableVariables).toStrictEqual(
        [],
      );
    });
    it('should set variablesDelimiters to empty string', () => {
      expect((wrapper.vm as any).variableDelimiters).toStrictEqual({ start: '', end: '' });
    });
    it('should set value to empty string', () => {
      expect((wrapper.vm as any).value).toBe('');
    });
    it('should set selected variable to undefined', () => {
      expect((wrapper.vm as any).variable).toBeUndefined();
    });
    it('should set bounds to empty date range', () => {
      expect((wrapper.vm as any).bounds).toStrictEqual({ start: undefined, end: undefined });
    });
    it('should display placeholder input label', () => {
      expect(wrapper.find('.widget-date-input__label').text()).toStrictEqual('Select a date');
    });
  });
});
