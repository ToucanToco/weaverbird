import { describe, expect, it, vi } from 'vitest';

import AddTextColumnStepForm from '@/components/stepforms/AddTextColumnStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('Add Text Column Step Form', () => {
  const runner = new BasicStepFormTestRunner(AddTextColumnStepForm, 'text');
  runner.testInstantiate();
  runner.testExpectedComponents({
    'inputtextwidget-stub': 2,
  });

  it('should pass down properties', async () => {
    const wrapper = runner.shallowMount();
    wrapper.setData({ editedStep: { name: 'text', text: 'some text', newColumn: 'foo' } });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.newColumnInput').props('value')).toEqual('foo');
    expect(wrapper.find('.textInput').props('value')).toEqual('some text');
  });

  it('should make the focus on the column added after validation', () => {
    const wrapper = runner.mount({
      propsData: { columnTypes: { columnA: 'string', columnB: 'string', columnC: 'string' } },
    });
    wrapper.setData({ editedStep: { name: 'text', text: 'some text', newColumn: 'foo' } });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.emitted().setSelectedColumns).toEqual([[{ column: 'foo' }]]);
  });

  it('should not change the column focus if validation fails', () => {
    const wrapper = runner.mount({
      propsData: {
        columnTypes: { columnA: 'string', columnB: 'string', columnC: 'string' },
        selectedColumns: ['columnA'],
      },
      data: {
        editedStep: { name: 'text', text: '', newColumn: 'columnB' },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.emitted().setSelectedColumns).toBeUndefined();
  });

  describe('Warning', () => {
    it('should report a warning when newColumn is an already existing column name', async () => {
      const wrapper = runner.shallowMount({
        propsData: {
          columnTypes: { columnA: 'string' },
        },
      });
      wrapper.setData({ editedStep: { text: '', newColumn: 'columnA' } });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.newColumnInput').props().warning).toEqual(
        'A column name "columnA" already exists. You will overwrite it.',
      );
    });

    it('should not report any warning if newColumn is not an already existing column name', async () => {
      const wrapper = runner.shallowMount({
        propsData: {
          columnTypes: { columnA: 'string' },
        },
      });
      wrapper.setData({ editedStep: { text: '', newColumn: 'columnB' } });
      await wrapper.vm.$nextTick();
      expect(wrapper.find('.newColumnInput').props().warning).toBeNull();
    });
  });
});
