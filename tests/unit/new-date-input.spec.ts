import { shallowMount, Wrapper } from '@vue/test-utils';

import NewDateInput from '@/components/stepforms/widgets/DateComponents/NewDateInput.vue';
import { dateToString, RelativeDate } from '@/lib/dates';
import * as sendAnalyticsUtils from '@/lib/send-analytics';

jest.mock('@/components/FAIcon.vue');
jest.mock('@/components/DatePicker/Calendar.vue');

const RELATIVE_SAMPLE_VARIABLES = [
  {
    label: 'Today',
    identifier: 'today',
    value: new Date(2020, 11),
  },
];

const SAMPLE_VARIABLES = [
  {
    identifier: 'dates.last_7_days',
    label: 'Last 7 days',
  },
  {
    identifier: 'dates.last_14_days',
    label: 'Last 14 days',
  },
  {
    identifier: 'dates.last_30_days',
    label: 'Last 30 days',
  },
  {
    identifier: 'dates.last_3_months',
    label: 'Last 3 Months',
  },
  {
    identifier: 'dates.last_12_months',
    label: 'Last 12 Months',
  },
  {
    identifier: 'dates.month_to_date',
    label: 'Month to date',
  },
  {
    identifier: 'dates.quarter_to_date',
    label: 'Quarter to date',
  },
  {
    identifier: 'dates.all_time',
    label: 'All time',
  },
  ...RELATIVE_SAMPLE_VARIABLES,
];

describe('Date input', () => {
  let wrapper: Wrapper<NewDateInput>;
  let sendAnalyticsSpy: jest.SpyInstance;
  const createWrapper = (propsData = {}) => {
    sendAnalyticsSpy = jest.spyOn(sendAnalyticsUtils, 'sendAnalytics');
    wrapper = shallowMount(NewDateInput, {
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
        wrapper.find('.widget-date-input__container').trigger('click');
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
      it('should send analytics event', () => {
        expect(sendAnalyticsSpy).toHaveBeenCalledWith({
          name: 'Date input - Select variable',
          value: selectedVariable,
        });
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
    });

    describe('when choosing an advanced variable', () => {
      beforeEach(async () => {
        wrapper.find('CustomVariableList-stub').vm.$emit('addAdvancedVariable');
        await wrapper.vm.$nextTick();
      });

      it('should hide editor', () => {
        expect(wrapper.find('popover-stub').props().visible).toBe(false);
      });

      it('should open the advanced variable modal', () => {
        expect(wrapper.find('AdvancedVariableModal-stub').props().isOpened).toBe(true);
      });
    });

    describe('when closing the advanced variable modal', () => {
      beforeEach(async () => {
        wrapper.find('AdvancedVariableModal-stub').vm.$emit('closed');
        await wrapper.vm.$nextTick();
      });

      it('should close the modal', () => {
        expect(wrapper.find('AdvancedVariableModal-stub').props().isOpened).toBe(false);
      });
    });

    describe('when saving an advanced variable', () => {
      beforeEach(async () => {
        wrapper.find('AdvancedVariableModal-stub').vm.$emit('input', 'Test');
        await wrapper.vm.$nextTick();
      });

      it('should emit the new value with delimiters', () => {
        expect(wrapper.emitted('input')).toHaveLength(1);
        expect(wrapper.emitted('input')[0]).toEqual(['{{ Test }}']);
      });
      it('should send analytics event', () => {
        expect(sendAnalyticsSpy).toHaveBeenCalledWith({
          name: 'Date input - Select advanced variable',
          value: 'Test',
        });
      });
    });
  });

  describe('custom editor', () => {
    beforeEach(() => {
      createWrapper({
        availableVariables: SAMPLE_VARIABLES,
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
      const editedValue: RelativeDate = {
        quantity: 1,
        duration: 'month',
        operator: 'until',
        date: '{{today}}',
      };

      beforeEach(async () => {
        wrapper.find('RelativeDateForm-stub').vm.$emit('input', editedValue);
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
        expect(wrapper.find('Calendar-stub').exists()).toBe(true);
        expect(wrapper.find('RelativeDateForm-stub').exists()).toBe(false);
      });
      it('should have a disabled save button', () => {
        expect(wrapper.find({ ref: 'save' }).attributes('disabled')).toBe('disabled');
      });

      describe('when updating Calendar value', () => {
        const newValue = new Date(8);
        beforeEach(async () => {
          wrapper.find('Calendar-stub').vm.$emit('input', newValue);
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

    describe('when selecting "Relative" tab', () => {
      beforeEach(async () => {
        wrapper.find('Tabs-stub').vm.$emit('tabSelected', 'Relative');
        await wrapper.vm.$nextTick();
      });
      it('should pass filtered available variables using only dates one as relative variables', () => {
        expect(wrapper.find('RelativeDateForm-stub').props().availableVariables).toStrictEqual(
          RELATIVE_SAMPLE_VARIABLES,
        );
      });
      it('should display correct body component', () => {
        expect(wrapper.find('RelativeDateForm-stub').exists()).toBe(true);
        expect(wrapper.find('Calendar-stub').exists()).toBe(false);
      });

      describe('when updating RelativeDateForm value', () => {
        const newValue = { quantity: -1, duration: 'month' };
        beforeEach(async () => {
          wrapper.find('RelativeDateForm-stub').vm.$emit('input', newValue);
          await wrapper.vm.$nextTick();
        });
        it('should update tab value', () => {
          expect((wrapper.vm as any).currentTabValue).toStrictEqual(newValue);
        });
      });
      describe('when saving', () => {
        const newValue = {
          quantity: 1,
          duration: 'month',
          operator: 'until',
          date: '{{today}}',
        };
        beforeEach(async () => {
          wrapper.find('RelativeDateForm-stub').vm.$emit('input', newValue);
          wrapper.find({ ref: 'save' }).trigger('click');
          await wrapper.vm.$nextTick();
        });
        it('should send analytics event when saving', () => {
          expect(sendAnalyticsSpy).toHaveBeenCalledWith({
            name: 'Date input - Select relative date',
            value: newValue,
          });
        });
      });
    });

    describe('when switching between tabs', () => {
      const updatedRelativeDateValue = {
        quantity: 1,
        duration: 'month',
        operator: 'until',
        date: '{{today}}',
      };
      beforeEach(async () => {
        wrapper.find('RelativeDateForm-stub').vm.$emit('input', updatedRelativeDateValue); // update RelativeDateForm value
        await wrapper.vm.$nextTick();
        wrapper.find('Tabs-stub').vm.$emit('tabSelected', 'Fixed'); // switching to the other tab
        await wrapper.vm.$nextTick();
        wrapper.find('Tabs-stub').vm.$emit('tabSelected', 'Relative'); // come back to previous tab
      });
      it('should not remove other tab value', () => {
        expect(wrapper.find('RelativeDateForm-stub').props().value).toBe(updatedRelativeDateValue);
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
    it('should pass selected variable identifier to CustomVariableList', () => {
      expect(wrapper.find('CustomVariableList-stub').props().selectedVariables).toStrictEqual(
        selectedVariable.identifier,
      );
    });
    it('should display variable tag instead of label', () => {
      expect(wrapper.find('.widget-date-input__label').exists()).toBe(false);
      expect(wrapper.find('VariableTag-stub').exists()).toBe(true);
    });
  });

  describe('with selected value as advanced variable', () => {
    const advancedVariable = '{{ i am an advanced variable }}';
    beforeEach(() => {
      createWrapper({
        availableVariables: SAMPLE_VARIABLES,
        variableDelimiters: { start: '{{', end: '}}' },
        value: advancedVariable,
      });
    });
    it('should display variable tag instead of label', () => {
      expect(wrapper.find('.widget-date-input__label').exists()).toBe(false);
      expect(wrapper.find('VariableTag-stub').exists()).toBe(true);
    });
    it('should pass advanced variable to advanced variable modal', () => {
      expect(wrapper.find('AdvancedVariableModal-stub').props().variable).toStrictEqual(
        advancedVariable,
      );
    });
    describe('when clicking on variable tag', () => {
      beforeEach(async () => {
        await wrapper.find('VariableTag-stub').vm.$emit('edited');
      });
      it('should open the advanced variable modal', () => {
        expect(wrapper.find('AdvancedVariableModal-stub').props().isOpened).toBe(true);
      });
    });
    describe('when removing the variable tag', () => {
      beforeEach(async () => {
        await wrapper.find('VariableTag-stub').vm.$emit('removed');
      });
      it('should reset value', () => {
        expect(wrapper.emitted().input[0][0]).toStrictEqual(undefined);
      });
      it('should hide editor', () => {
        expect(wrapper.find('popover-stub').props().visible).toBe(false);
      });
    });
  });

  describe('with selected value as custom date', () => {
    const value = new Date();
    beforeEach(() => {
      createWrapper({
        availableVariables: SAMPLE_VARIABLES,
        variableDelimiters: { start: '{{', end: '}}' },
        value,
      });
    });

    it('should display date as UTC for input label', () => {
      expect(wrapper.find('.widget-date-input__label').text()).toStrictEqual(dateToString(value));
    });

    it('should select "Fixed" tab by default', () => {
      expect(wrapper.find('Tabs-stub').props().selectedTab).toBe('Fixed');
    });

    it('should preselect value in Calendar', () => {
      expect(wrapper.find('Calendar-stub').props().value).toStrictEqual(value);
    });
    it('should have an enabled save button', () => {
      expect(wrapper.find({ ref: 'save' }).attributes('disabled')).not.toBe('disabled');
    });
  });

  describe('with selected value as relative date', () => {
    const value = {
      quantity: 1,
      duration: 'month',
      operator: 'from',
      date: '{{today}}',
    };
    beforeEach(() => {
      createWrapper({
        availableVariables: SAMPLE_VARIABLES,
        variableDelimiters: { start: '{{', end: '}}' },
        value,
      });
    });

    it('should display readable input label', () => {
      expect(wrapper.find('.widget-date-input__label').text()).toStrictEqual('1 months from Today');
    });

    it('should select "Relative" tab by default', () => {
      expect(wrapper.find('Tabs-stub').props().selectedTab).toBe('Relative');
    });
    it('should preselect value in RelativeDateForm', () => {
      expect(wrapper.find('RelativeDateForm-stub').props().value).toStrictEqual(value);
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

  describe('without available variables', () => {
    beforeEach(async () => {
      createWrapper({
        availableVariables: [],
        variableDelimiters: { start: '{{', end: '}}' },
      });
      wrapper.find('.widget-date-input__container').trigger('click');
      await wrapper.vm.$nextTick();
    });
    it('should display Custom editor directly when clicking on open button', () => {
      expect(wrapper.find({ ref: 'custom-editor' }).isVisible()).toBe(true);
    });
    it('should not display Custom variable list', () => {
      expect(wrapper.find('CustomVariableList-stub').exists()).toBe(false);
    });
  });

  describe('with bounds', () => {
    const bounds = { start: new Date('2020/1/1'), end: new Date('2020/6/1') };
    beforeEach(() => {
      createWrapper({
        availableVariables: SAMPLE_VARIABLES,
        variableDelimiters: { start: '{{', end: '}}' },
        bounds,
        value: new Date('2020/2/1'),
      });
    });
    it('should pass bounds to calendar', () => {
      expect(wrapper.find('Calendar-stub').props().availableDates).toStrictEqual(bounds);
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
      expect(wrapper.find('RelativeDateForm-stub').props().availableVariables).toStrictEqual([]);
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
