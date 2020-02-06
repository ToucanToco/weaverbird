import { shallowMount, Wrapper } from '@vue/test-utils';
import Vue from 'vue';

import ConditionsGroup from '@/components/stepforms/ConditionsEditor/ConditionsGroup.vue';

let wrapper: Wrapper<Vue>;

describe('ConditionsGroup', () => {
  it('should instantiate', () => {
    const wrapper = shallowMount(ConditionsGroup);
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should not have the class "conditions-group--root"', () => {
    const wrapper = shallowMount(ConditionsGroup);
    expect(wrapper.find('.conditions-group').classes()).not.toContain('conditions-group--root');
  });

  it('should have the class "conditions-group__switch-button--active" on the right switch button', () => {
    const wrapper = shallowMount(ConditionsGroup, {
      propsData: {
        conditionsTree: {
          operator: 'or',
          conditions: [
            undefined,
            undefined,
          ],
        },
      }
    });
    expect(wrapper.find('#switch-button-or').classes()).toContain('conditions-group__switch-button--active');
  });

  describe('when the group is the root', () => {
    beforeEach(() => {
      wrapper = shallowMount(ConditionsGroup, {
        propsData: {
          isRootGroup: true,
          conditionsTree: {
            conditions: [
              'only condition',
            ],
          },
        }
      });
    });

    afterEach(() => {
      wrapper.destroy();
    });

    it('should have the class "conditions-group--root"', () => {
      expect(wrapper.find('.conditions-group').classes()).toContain('conditions-group--root');
    });

    it('should not display the trash button for the group', () => {
      expect(wrapper.find('.conditions-group__delete').exists()).toBeFalsy();
    });
  });

  describe('when the group has multiple rows', () => {
    beforeEach(() => {
      wrapper = shallowMount(ConditionsGroup, {
        propsData: {
          conditionsTree: {
            conditions: [
              'condition A',
              'condition B'
            ]
          },
        }
      });
    });

    afterEach(() => {
      wrapper.destroy();
    });

    it('should have the class "conditions-group--with-switch"', () => {
      expect(wrapper.find('.conditions-group').classes()).toContain('conditions-group--with-switch');
    });

    it('should have the switch button', () => {
      expect(wrapper.find('.conditions-group__switch').exists()).toBeTruthy();
    });

    it('should have the link', () => {
      expect(wrapper.find('.condition-row__link').exists()).toBeTruthy();
    });
  });

  describe('when the group has groups', () => {
    beforeEach(() => {
      wrapper = shallowMount(ConditionsGroup, {
        propsData: {
          conditionsTree: {
            conditions: [
              'condition A',
            ],
            groups: [
              {
                conditions: [
                  'condition B',
                ],
              }
            ]
          },
        }
      });
    });

    afterEach(() => {
      wrapper.destroy();
    });

    it('should have the class "conditions-group--with-switch"', () => {
      expect(wrapper.find('.conditions-group').classes()).toContain('conditions-group--with-switch');
    });

    it('should have the switch button', () => {
      expect(wrapper.find('.conditions-group__switch').exists()).toBeTruthy();
    });

    it('should have the link', () => {
      expect(wrapper.find('.condition-row__link').exists()).toBeTruthy();
    });

    it('should display the trash button', () => {
      const wrapper = shallowMount(ConditionsGroup);
      expect(wrapper.find('.conditions-group__delete').exists()).toBeTruthy();
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
              }
            ]
          },
        }
      });
    });

    afterEach(() => {
      wrapper.destroy();
    });

    it('should emit "conditionsTreeUpdated" with the new conditionTree when clicking on "add condition" button', () => {
      wrapper.find('#add-row-button').trigger('click');
      expect(wrapper.emitted().conditionsTreeUpdated).toBeDefined();
      expect(wrapper.emitted().conditionsTreeUpdated[0]).toEqual([{
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
          undefined,
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
          }
        ]
      }]);
    });

    it('should emit "conditionsTreeUpdated" with the new conditionTree when clicking on "add group" button', () => {
      wrapper.find('#add-group-button').trigger('click');
      expect(wrapper.emitted().conditionsTreeUpdated).toBeDefined();
      expect(wrapper.emitted().conditionsTreeUpdated[0]).toEqual([{
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
            conditions: [
              undefined,
              undefined,
            ],
            groups: [],
          }
        ]
      }]);
    });

    it('should emit "conditionsTreeUpdated" with the new conditionTree when clicking on "delete row button"', () => {
      wrapper.findAll('.condition-row__delete').at(0).trigger('click');
      expect(wrapper.emitted().conditionsTreeUpdated).toBeDefined();
      expect(wrapper.emitted().conditionsTreeUpdated[0]).toEqual([{
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
          }
        ]
      }]);
    });

    it('should emit "conditionsTreeUpdated" with the new conditionTree when its group emit "groupDeleted" event', () => {
      wrapper.find('conditionsgroup-stub').vm.$emit('groupDeleted');
      expect(wrapper.emitted().conditionsTreeUpdated).toBeDefined();
      expect(wrapper.emitted().conditionsTreeUpdated[0]).toEqual([{
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
      }]);
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
      expect(wrapper.emitted().conditionsTreeUpdated[0]).toEqual([{
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
          }
        ]
      }]);
    });

    it('should emit "conditionsTreeUpdated" with the new conditionTree when "or" operator button is click', () => {
      wrapper.find('#switch-button-or').trigger('click');
      expect(wrapper.emitted().conditionsTreeUpdated).toBeDefined();
      expect(wrapper.emitted().conditionsTreeUpdated[0]).toEqual([{
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
          }
        ]
      }]);
    });

    it('should emit "conditionsTreeUpdated" with the new conditionTree when the slot emit an event', () => {
      (wrapper.vm as any).updateCondition(0)({
        column: 'leader',
        comparison: 'eq',
        value: 'arthas',
      });
      expect(wrapper.emitted().conditionsTreeUpdated).toBeDefined();
      expect(wrapper.emitted().conditionsTreeUpdated[0]).toEqual([{
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
          }
        ]
      }]);
    });
  });
});
