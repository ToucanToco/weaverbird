import type { Wrapper } from '@vue/test-utils';
import { shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type Vue from 'vue';

import ConditionsGroup from '@/components/ConditionsEditor/ConditionsGroup.vue';

let wrapper: Wrapper<Vue>;
const defaultValue = { column: '', operator: 'eq', value: '' };

describe('ConditionsGroup', () => {
  it('should instantiate', () => {
    wrapper = shallowMount(ConditionsGroup, { propsData: { defaultValue } });
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should not have the class "conditions-group--root"', () => {
    wrapper = shallowMount(ConditionsGroup, { propsData: { defaultValue } });
    expect(wrapper.find('.conditions-group').classes()).not.toContain('conditions-group--root');
  });

  it('should not display the trash button for a row when there is only one condition', () => {
    wrapper = shallowMount(ConditionsGroup, {
      propsData: {
        conditionsTree: {
          operator: '',
          conditions: [defaultValue],
          groups: [],
        },
        defaultValue,
      },
    });
    expect(wrapper.find('.condition-row__delete').exists()).toBeFalsy();
  });

  it('should display the trash button for a row if there is at least a group', () => {
    wrapper = shallowMount(ConditionsGroup, {
      propsData: {
        conditionsTree: {
          operator: 'and',
          conditions: [defaultValue],
          groups: [
            {
              operator: 'or',
              conditions: [defaultValue, defaultValue],
              groups: [],
            },
          ],
        },
        defaultValue,
      },
    });
    expect(wrapper.find('.condition-row__delete').exists()).toBeTruthy();
  });

  it('should display the trash button for a row when there is more than one condition', () => {
    wrapper = shallowMount(ConditionsGroup, {
      propsData: {
        conditionsTree: {
          operator: 'and',
          conditions: [defaultValue, defaultValue],
          groups: [],
        },
        defaultValue,
      },
    });
    expect(wrapper.find('.condition-row__delete').exists()).toBeTruthy();
  });

  it('should have the class "conditions-group__switch-button--active" on the right switch button', () => {
    wrapper = shallowMount(ConditionsGroup, {
      propsData: {
        conditionsTree: {
          operator: 'or',
          conditions: [undefined],
          groups: [],
        },
        defaultValue,
      },
    });
    expect(wrapper.find('.conditions-group__switch-button--or').classes()).toContain(
      'conditions-group__switch-button--active',
    );
  });

  describe('when the group is the root', () => {
    beforeEach(() => {
      wrapper = shallowMount(ConditionsGroup, {
        propsData: {
          isRootGroup: true,
          conditionsTree: {
            conditions: ['only condition'],
            groups: [undefined],
          },
          defaultValue,
        },
      });
    });

    afterEach(() => {
      wrapper.destroy();
    });

    it('should be able to add sub groups', () => {
      expect(wrapper.find('.conditions-group__add-button--group').exists()).toBeTruthy();
    });
  });

  describe('when the group is not the root', () => {
    beforeEach(() => {
      wrapper = shallowMount(ConditionsGroup, {
        propsData: {
          isRootGroup: false,
          conditionsTree: {
            conditions: ['only condition'],
            groups: [undefined],
          },
          defaultValue,
        },
      });
    });

    afterEach(() => {
      wrapper.destroy();
    });

    it('should not be able to add sub groups', () => {
      expect(wrapper.find('.conditions-group__add-button--group').exists()).toBeFalsy();
    });
  });

  describe('when the group has multiple rows', () => {
    beforeEach(() => {
      wrapper = shallowMount(ConditionsGroup, {
        propsData: {
          conditionsTree: {
            conditions: ['condition A', 'condition B'],
          },
          defaultValue,
        },
      });
    });

    afterEach(() => {
      wrapper.destroy();
    });

    it('should have the switch button to choose an operator', () => {
      expect(wrapper.find('.conditions-group').classes()).toContain(
        'conditions-group--with-switch',
      );
      expect(wrapper.find('.conditions-group__switch').exists()).toBeTruthy();
    });

    describe('links', () => {
      it('should be plain links for all elements but the last condition', () => {
        const conditionRowWrappers = wrapper.findAll('.condition-row');
        expect(conditionRowWrappers.at(0).find('.condition-row__link').classes()).not.toContain(
          'condition-row__link--last',
        );
        expect(conditionRowWrappers.at(1).find('.condition-row__link').classes()).toContain(
          'condition-row__link--last',
        );
      });
    });
  });

  describe('with child groups', () => {
    beforeEach(() => {
      wrapper = shallowMount(ConditionsGroup, {
        propsData: {
          conditionsTree: {
            conditions: ['condition A', 'condition A'],
            groups: [
              {
                conditions: ['condition B', 'condition C'],
              },
              {
                conditions: ['condition D', 'condition E'],
              },
            ],
          },
          defaultValue,
        },
      });
    });

    afterEach(() => {
      wrapper.destroy();
    });

    it('should have the operator switch button', () => {
      expect(wrapper.find('.conditions-group__switch').exists()).toBeTruthy();
    });

    it('should display a link', () => {
      expect(wrapper.find('.conditions-group__link').exists()).toBeTruthy();
    });

    describe('links', () => {
      it('should be plain links for all elements but the last group', () => {
        const conditionRowWrappers = wrapper.findAll('.condition-row');
        expect(conditionRowWrappers.at(0).find('.condition-row__link').classes()).not.toContain(
          'condition-row__link--last',
        );
        expect(conditionRowWrappers.at(1).find('.condition-row__link').classes()).not.toContain(
          'condition-row__link--last',
        );

        const childGroupWrappers = wrapper.findAll('.conditions-group__child-group');
        expect(childGroupWrappers.at(0).find('.conditions-group__link').classes()).not.toContain(
          'conditions-group__link--last',
        );
        expect(childGroupWrappers.at(1).find('.conditions-group__link').classes()).toContain(
          'conditions-group__link--last',
        );
      });
    });

    it('should display the trash button for each group', () => {
      const childGroupWrapper = wrapper.find('.conditions-group__child-group');
      expect(childGroupWrapper.find('.conditions-group__delete').exists()).toBeTruthy();
    });
  });

  describe('click actions', () => {
    beforeEach(() => {
      wrapper = shallowMount(ConditionsGroup, {
        propsData: {
          isRootGroup: true,
          conditionsTree: {
            operator: 'and',
            conditions: [
              {
                column: 'a',
                comparison: 'eq',
                value: 'toto',
              },
              {
                column: 'b',
                comparison: 'eq',
                value: 'tata',
              },
            ],
            groups: [
              {
                conditions: [
                  {
                    column: 'c',
                    comparison: 'eq',
                    value: 'tutu',
                  },
                ],
              },
            ],
          },
          defaultValue,
        },
      });
    });

    afterEach(() => {
      wrapper.destroy();
    });

    it('should emit "conditionsTreeUpdated" with the new conditionTree when clicking on "add condition" button', () => {
      wrapper.find('.conditions-group__add-button--condition').trigger('click');
      expect(wrapper.emitted().conditionsTreeUpdated).toBeDefined();
      expect(wrapper.emitted().conditionsTreeUpdated[0]).toEqual([
        {
          operator: 'and',
          conditions: [
            {
              column: 'a',
              comparison: 'eq',
              value: 'toto',
            },
            {
              column: 'b',
              comparison: 'eq',
              value: 'tata',
            },
            defaultValue,
          ],
          groups: [
            {
              conditions: [
                {
                  column: 'c',
                  comparison: 'eq',
                  value: 'tutu',
                },
              ],
            },
          ],
        },
      ]);
    });

    it('should emit "conditionsTreeUpdated" with the new conditionTree and set the operator to "and" when clicking on "add row" button and the operator is an empty string', () => {
      wrapper.setProps({
        conditionsTree: {
          operator: '',
          conditions: [
            {
              column: 'a',
              comparison: 'eq',
              value: 'toto',
            },
          ],
          groups: [],
        },
      });
      wrapper.find('.conditions-group__add-button--condition').trigger('click');
      expect(wrapper.emitted().conditionsTreeUpdated).toBeDefined();
      expect(wrapper.emitted().conditionsTreeUpdated[0]).toEqual([
        {
          operator: 'and',
          conditions: [
            {
              column: 'a',
              comparison: 'eq',
              value: 'toto',
            },
            defaultValue,
          ],
          groups: [],
        },
      ]);
    });

    it('should emit "conditionsTreeUpdated" with the new conditionTree when clicking on "add group" button', () => {
      wrapper.find('.conditions-group__add-button--group').trigger('click');
      expect(wrapper.emitted().conditionsTreeUpdated).toBeDefined();
      expect(wrapper.emitted().conditionsTreeUpdated[0]).toEqual([
        {
          operator: 'and',
          conditions: [
            {
              column: 'a',
              comparison: 'eq',
              value: 'toto',
            },
            {
              column: 'b',
              comparison: 'eq',
              value: 'tata',
            },
          ],
          groups: [
            {
              conditions: [
                {
                  column: 'c',
                  comparison: 'eq',
                  value: 'tutu',
                },
              ],
            },
            {
              operator: 'and',
              conditions: [defaultValue],
              groups: [],
            },
          ],
        },
      ]);
    });

    it('should emit "conditionsTreeUpdated" with the new conditionTree and set the operator to "and" when clicking on "add group" and the operator is an empty string', () => {
      wrapper.setProps({
        conditionsTree: {
          operator: '',
          conditions: [
            {
              column: 'a',
              comparison: 'eq',
              value: 'toto',
            },
          ],
          groups: [],
        },
      });
      wrapper.find('.conditions-group__add-button--group').trigger('click');
      expect(wrapper.emitted().conditionsTreeUpdated).toBeDefined();
      expect(wrapper.emitted().conditionsTreeUpdated[0]).toEqual([
        {
          operator: 'and',
          conditions: [
            {
              column: 'a',
              comparison: 'eq',
              value: 'toto',
            },
          ],
          groups: [
            {
              operator: 'and',
              conditions: [defaultValue],
              groups: [],
            },
          ],
        },
      ]);
    });

    it('should emit "conditionsTreeUpdated" with the new conditionTree when clicking on "delete row button"', () => {
      wrapper.findAll('.condition-row__delete').at(0).trigger('click');
      expect(wrapper.emitted().conditionsTreeUpdated).toBeDefined();
      expect(wrapper.emitted().conditionsTreeUpdated[0]).toEqual([
        {
          operator: 'and',
          conditions: [
            {
              column: 'b',
              comparison: 'eq',
              value: 'tata',
            },
          ],
          groups: [
            {
              conditions: [
                {
                  column: 'c',
                  comparison: 'eq',
                  value: 'tutu',
                },
              ],
            },
          ],
        },
      ]);
    });

    it('should emit "conditionsTreeUpdated" with the new conditionTree when hitting the trash button for a group', () => {
      wrapper.find('.conditions-group__child-group .conditions-group__delete').trigger('click');
      expect(wrapper.emitted().conditionsTreeUpdated).toBeDefined();
      expect(wrapper.emitted().conditionsTreeUpdated[0]).toEqual([
        {
          operator: 'and',
          conditions: [
            {
              column: 'a',
              comparison: 'eq',
              value: 'toto',
            },
            {
              column: 'b',
              comparison: 'eq',
              value: 'tata',
            },
          ],
          groups: [],
        },
      ]);
    });

    it('should emit "conditionsTreeUpdated" with the new conditionTree when its group emit "conditionsTreeUpdated" event', () => {
      wrapper.find('conditionsgroup-stub').vm.$emit('conditionsTreeUpdated', {
        conditions: [
          {
            column: 'd',
            comparison: 'eq',
            value: 'blublu',
          },
        ],
      });
      expect(wrapper.emitted().conditionsTreeUpdated).toBeDefined();
      expect(wrapper.emitted().conditionsTreeUpdated[0]).toEqual([
        {
          operator: 'and',
          conditions: [
            {
              column: 'a',
              comparison: 'eq',
              value: 'toto',
            },
            {
              column: 'b',
              comparison: 'eq',
              value: 'tata',
            },
          ],
          groups: [
            {
              conditions: [
                {
                  column: 'd',
                  comparison: 'eq',
                  value: 'blublu',
                },
              ],
            },
          ],
        },
      ]);
    });

    it('should emit "conditionsTreeUpdated" with the new conditionTree when "or" operator button is click', () => {
      wrapper.find('.conditions-group__switch-button--or').trigger('click');
      expect(wrapper.emitted().conditionsTreeUpdated).toBeDefined();
      expect(wrapper.emitted().conditionsTreeUpdated[0]).toEqual([
        {
          operator: 'or',
          conditions: [
            {
              column: 'a',
              comparison: 'eq',
              value: 'toto',
            },
            {
              column: 'b',
              comparison: 'eq',
              value: 'tata',
            },
          ],
          groups: [
            {
              conditions: [
                {
                  column: 'c',
                  comparison: 'eq',
                  value: 'tutu',
                },
              ],
            },
          ],
        },
      ]);
    });

    it('should emit "conditionsTreeUpdated" with the new conditionTree when the slot emits an event', () => {
      (wrapper.vm as any).updateCondition(0)({
        column: 'leader',
        comparison: 'eq',
        value: 'arthas',
      });
      expect(wrapper.emitted().conditionsTreeUpdated).toBeDefined();
      expect(wrapper.emitted().conditionsTreeUpdated[0]).toEqual([
        {
          operator: 'and',
          conditions: [
            {
              column: 'leader',
              comparison: 'eq',
              value: 'arthas',
            },
            {
              column: 'b',
              comparison: 'eq',
              value: 'tata',
            },
          ],
          groups: [
            {
              conditions: [
                {
                  column: 'c',
                  comparison: 'eq',
                  value: 'tutu',
                },
              ],
            },
          ],
        },
      ]);
    });
  });

  it('should set the operator to "and" when the operator is empty (when setOperatorIfNecessaryAndUpdateConditionTree is called)', () => {
    wrapper = shallowMount(ConditionsGroup, { propsData: { defaultValue } });
    const newConditionsTree = {
      operator: '',
      conditions: [
        {
          column: 'a',
          comparison: 'eq',
          value: 'toto',
        },
        {
          column: 'b',
          comparison: 'eq',
          value: 'tutu',
        },
      ],
      groups: [],
    };
    (wrapper.vm as any).setOperatorIfNecessaryAndUpdateConditionTree(newConditionsTree);
    expect(wrapper.emitted().conditionsTreeUpdated).toBeDefined();
    expect(wrapper.emitted().conditionsTreeUpdated[0]).toEqual([
      {
        operator: 'and',
        conditions: [
          {
            column: 'a',
            comparison: 'eq',
            value: 'toto',
          },
          {
            column: 'b',
            comparison: 'eq',
            value: 'tutu',
          },
        ],
        groups: [],
      },
    ]);
  });

  it('should NOT set the operator to "and" when the operator is already defined (when setOperatorIfNecessaryAndUpdateConditionTree is called)', () => {
    const conditionsTree = {
      operator: 'or',
      conditions: [
        {
          column: 'a',
          comparison: 'eq',
          value: 'toto',
        },
        {
          column: 'b',
          comparison: 'eq',
          value: 'tutu',
        },
        {
          column: 'c',
          comparison: 'eq',
          value: 'titi',
        },
      ],
      groups: [],
    };
    wrapper = shallowMount(ConditionsGroup, {
      propsData: {
        conditionsTree,
        defaultValue,
      },
    });

    (wrapper.vm as any).setOperatorIfNecessaryAndUpdateConditionTree(conditionsTree);
    expect(wrapper.emitted().conditionsTreeUpdated).toBeDefined();
    expect(wrapper.emitted().conditionsTreeUpdated[0]).toEqual([
      {
        operator: 'or',
        conditions: [
          {
            column: 'a',
            comparison: 'eq',
            value: 'toto',
          },
          {
            column: 'b',
            comparison: 'eq',
            value: 'tutu',
          },
          {
            column: 'c',
            comparison: 'eq',
            value: 'titi',
          },
        ],
        groups: [],
      },
    ]);
  });

  it('should set the operator to an empty string when there is only one condition and no group (when resetOperatorIfNecessary is called)', async () => {
    wrapper = shallowMount(ConditionsGroup, {
      propsData: {
        conditionsTree: {
          operator: 'and',
          conditions: [
            {
              column: 'a',
              comparison: 'eq',
              value: 'toto',
            },
          ],
          groups: [],
        },
        defaultValue,
      },
    });
    await (wrapper.vm as any).resetOperatorIfNecessary();
    expect(wrapper.emitted().conditionsTreeUpdated).toBeDefined();
    expect(wrapper.emitted().conditionsTreeUpdated[0]).toEqual([
      {
        operator: '',
        conditions: [
          {
            column: 'a',
            comparison: 'eq',
            value: 'toto',
          },
        ],
        groups: [],
      },
    ]);
  });

  it('should NOT set the operator to an empty string when there is at least two conditions (when resetOperatorIfNecessary is called)', () => {
    wrapper = shallowMount(ConditionsGroup, {
      propsData: {
        conditionsTree: {
          operator: 'and',
          conditions: [
            {
              column: 'a',
              comparison: 'eq',
              value: 'toto',
            },
            {
              column: 'b',
              comparison: 'eq',
              value: 'tutu',
            },
          ],
          groups: [],
        },
        defaultValue,
      },
    });
    (wrapper.vm as any).resetOperatorIfNecessary();
    expect(wrapper.emitted().conditionsTreeUpdated).toBeUndefined();
  });

  it('should NOT set the operator to an empty string when there is at least one group (when resetOperatorIfNecessary is called)', () => {
    wrapper = shallowMount(ConditionsGroup, {
      propsData: {
        conditionsTree: {
          operator: 'and',
          conditions: [
            {
              column: 'a',
              comparison: 'eq',
              value: 'toto',
            },
          ],
          groups: [
            {
              column: 'b',
              comparison: 'eq',
              value: 'tutu',
            },
          ],
        },
        defaultValue,
      },
    });
    (wrapper.vm as any).resetOperatorIfNecessary();
    expect(wrapper.emitted().conditionsTreeUpdated).toBeUndefined();
  });
});
