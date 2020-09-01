import RenameStepForm from '@/components/stepforms/RenameStepForm.vue';

import { BasicStepFormTestRunner, setupMockStore } from './utils';

describe('Rename Step Form', () => {
  const runner = new BasicStepFormTestRunner(RenameStepForm, 'rename');

  runner.testInstantiate();

  runner.testExpectedComponents({ 'listwidget-stub': 1 });

  runner.testValidationErrors([
    {
      testlabel: 'toReplace strings are empty',
      errors: [
        { keyword: 'minLength', dataPath: '.toRename[0][0]' },
        { keyword: 'minLength', dataPath: '.toRename[0][1]' },
      ],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    store: setupMockStore({
      dataset: {
        headers: [
          { name: 'foo', type: 'string' },
          { name: 'hello', type: 'string' },
        ],
        data: [],
      },
    }),
    props: {
      initialStepValue: { name: 'rename', toRename: [['foo', 'bar']] },
    },
  });

  runner.testCancel();

  runner.testResetSelectedIndex();

  it('should update editedStep at creation depending on the selected column', async () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'toto' }, { name: 'foo' }],
        data: [],
      },
      selectedColumns: ['toto'],
    };
    const wrapper = runner.shallowMount(initialState, {
      propsData: {
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
    const initialState = {
      dataset: {
        headers: [{ name: 'toto' }, { name: 'foo' }],
        data: [],
      },
      selectedColumns: [null],
    };
    try {
      const wrapper = runner.shallowMount(initialState, {
        propsData: {
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
    const wrapper = runner.shallowMount(
      {},
      {
        propsData: {
          initialStepValue: {
            name: 'rename',
            oldname: 'foo',
            newname: 'bar',
          },
        },
      },
    );
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.$data.editedStep.toRename).toBeDefined();
    expect(wrapper.vm.$data.editedStep.toRename).toEqual([['foo', 'bar']]);
  });

  it('should pass down "toRename" to ListWidget', async () => {
    const wrapper = runner.shallowMount(
      {},
      {
        data: {
          editedStep: {
            name: 'rename',
            toRename: [['foo', 'bar']],
          },
        },
      },
    );
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
    const initialState = {
      dataset: {
        headers: [{ name: 'toto' }, { name: 'foo' }],
        data: [],
      },
    };
    const wrapper = runner.mount(initialState, {
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
    expect(wrapper.vm.$store.state.vqb.selectedColumns).toEqual(['bar']);
  });

  it('should not change the column focus if validation fails', () => {
    const initialState = {
      dataset: {
        headers: [{ name: 'toto' }, { name: 'foo' }],
        data: [],
      },
      selectedColumns: ['toto'],
    };
    const wrapper = runner.mount(initialState, {
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
    expect(wrapper.vm.$store.state.vqb.selectedColumns).toEqual(['toto']);
  });
});
