import { describe, expect, it, vi } from 'vitest';

import RenameStepForm from '@/components/stepforms/RenameStepForm.vue';

import { BasicStepFormTestRunner } from './utils';

vi.mock('@/components/FAIcon.vue');

describe('Rename Step Form', () => {
  const runner = new BasicStepFormTestRunner(RenameStepForm, 'rename');

  runner.testInstantiate();

  runner.testExpectedComponents({ 'listwidget-stub': 1 });

  runner.testValidationErrors([
    {
      testlabel: 'toReplace strings are empty',
      errors: [
        { keyword: 'minLength', dataPath: '.toRename.0.0' },
        { keyword: 'minLength', dataPath: '.toRename.0.1' },
      ],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      columnTypes: { toto: 'string', foo: 'string' },
      initialStepValue: { name: 'rename', toRename: [['foo', 'bar']] },
    },
  });

  runner.testCancel();

  it('should update editedStep at creation depending on the selected column', async () => {
    const wrapper = runner.shallowMount({
      propsData: {
        columnTypes: { toto: 'string', foo: 'string' },
        selectedColumns: ['toto'],
        initialStepValue: {
          name: 'rename',
          toRename: [['', '']],
        },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$data.editedStep.toRename).toEqual([['toto', '']]);
  });

  it('should return an error if trying to set a null column', async () => {
    try {
      const wrapper = runner.shallowMount({
        propsData: {
          columnTypes: { toto: 'string', foo: 'string' },
          selectedColumns: [null],
          initialStepValue: {
            name: 'rename',
            toRename: [['', '']],
          },
        },
      });
      await wrapper.vm.$nextTick();
    } catch (error) {
      expect(error.message).toBe('should not try to set null in rename "toRename" field');
    }
  });

  it('should convert editedStep from old configurations to new configuration', async () => {
    const wrapper = runner.shallowMount({
      propsData: {
        initialStepValue: {
          name: 'rename',
          oldname: 'foo',
          newname: 'bar',
        },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$data.editedStep.toRename).toBeDefined();
    expect(wrapper.vm.$data.editedStep.toRename).toEqual([['foo', 'bar']]);
  });

  it('should pass down "toRename" to ListWidget', async () => {
    const wrapper = runner.shallowMount({
      data: {
        editedStep: {
          name: 'rename',
          toRename: [['foo', 'bar']],
        },
      },
    });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('listwidget-stub').props().value).toEqual([['foo', 'bar']]);
  });

  it('should update editedStep when ListWidget is updated', async () => {
    const wrapper = runner.shallowMount({});
    await wrapper.vm.$nextTick();
    wrapper.find('listwidget-stub').vm.$emit('input', [['foo', 'bar']]);
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$data.editedStep.toRename).toEqual([['foo', 'bar']]);
  });

  it('should make the focus on the last column modified at submit', () => {
    const wrapper = runner.mount({
      propsData: {
        columnTypes: { toto: 'string', foo: 'string' },
      },
      data: {
        editedStep: {
          name: 'rename',
          toRename: [
            ['toto', 'tata'],
            ['foo', 'bar'],
          ],
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.emitted().setSelectedColumns).toEqual([[{ column: 'bar' }]]);
  });

  it('should not change the column focus if validation fails', () => {
    const wrapper = runner.mount({
      propsData: {
        columnTypes: { toto: 'string', foo: 'string' },
        selectedColumns: ['toto'],
      },
      data: {
        editedStep: {
          name: 'rename',
          toRename: [
            ['toto', ''],
            ['foo', 'bar'],
          ],
        },
      },
    });
    wrapper.find('.widget-form-action__button--validate').trigger('click');
    expect(wrapper.emitted().setSelectedColumns).toBeUndefined();
  });
});
