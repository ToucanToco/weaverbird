import { shallowMount, Wrapper } from '@vue/test-utils';

import NewDateInput from '@/components/stepforms/widgets/DateComponents/NewDateInput.vue';
import { dateToString } from '@/lib/dates';

jest.mock('@/components/FAIcon.vue');
jest.mock('@/components/DatePicker/Calendar.vue');

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
];

describe('Date input', () => {
  let wrapper: Wrapper<NewDateInput>;
  const createWrapper = (propsData = {}) => {
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
      const editedValue = { quantity: -1, duration: 'month' };

      beforeEach(async () => {
        wrapper.setData({ currentTabValue: editedValue });
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
    });

    describe('when switching between tabs', () => {
      const updatedRelativeDateValue = { quantity: -2, duration: 'month' };
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
    const value = { quantity: 1, duration: 'month' };
    beforeEach(() => {
      createWrapper({
        availableVariables: SAMPLE_VARIABLES,
        variableDelimiters: { start: '{{', end: '}}' },
        value,
      });
    });

    it('should display readable input label', () => {
      expect(wrapper.find('.widget-date-input__label').text()).toStrictEqual('1 months ago');
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
