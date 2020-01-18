import { shallowMount, createLocalVue } from '@vue/test-utils';
import Vuex, { Store } from 'vuex';

import ArgmaxStepForm from '@/components/stepforms/ArgmaxStepForm.vue';
import { setupMockStore, BasicStepFormTestRunner, RootState } from './utils';

const localVue = createLocalVue();
localVue.use(Vuex);

describe('Argmax Step Form', () => {
  let emptyStore: Store<RootState>;
  beforeEach(() => {
    emptyStore = setupMockStore({});
  });

  const runner = new BasicStepFormTestRunner(ArgmaxStepForm, 'argmax', localVue);
  runner.testInstantiate();
  runner.testExpectedComponents({
    'columnpicker-stub': 1,
    'multiselectwidget-stub': 1,
  });

  runner.testValidationErrors([
    {
      testlabel: 'submitted data is not valid',
      errors: [{ dataPath: '.column', keyword: 'minLength' }],
    },
  ]);

  runner.testValidate({
    testlabel: 'submitted data is valid',
    props: {
      initialStepValue: { name: 'argmax', column: 'foo', groups: ['bar'] },
    },
  });

  runner.testCancel();
  runner.testResetSelectedIndex({
    pipeline: [
      { name: 'domain', domain: 'foo' },
      { name: 'rename', oldname: 'foo', newname: 'bar' },
      { name: 'rename', oldname: 'baz', newname: 'spam' },
      { name: 'rename', oldname: 'tic', newname: 'tac' },
    ],
    selectedStepIndex: 2,
  });

  it('should pass down the properties to the input components', async () => {
    const wrapper = shallowMount(ArgmaxStepForm, { store: emptyStore, localVue });
    wrapper.setData({
      editedStep: { name: 'argmax', column: 'foo', groups: ['bar'] },
    });
    await localVue.nextTick();
    expect(wrapper.find('multiselectwidget-stub').props('value')).toEqual(['bar']);
  });
});
