import { mount, shallowMount, Wrapper } from '@vue/test-utils';

import FAIcon from '@/components/FAIcon.vue';

describe('FAIcon', () => {
  let wrapper: Wrapper<FAIcon>;

  beforeEach(() => {
    wrapper = shallowMount(FAIcon, {
      sync: false,
      propsData: {
        icon: 'filter',
      },
    });
  });

  it('should instantiate', () => {
    expect(wrapper.exists()).toBeTruthy();
  });

  it('should add a font awesome icon', () => {
    expect(wrapper.find('FontAwesomeIcon-stub').exists()).toBe(true);
  });

  it('should pass icon name to icon', () => {
    expect(wrapper.find('FontAwesomeIcon-stub').attributes().icon).toStrictEqual('filter');
  });

  describe('with specific style', () => {
    beforeEach(() => {
      wrapper.setProps({ icon: 'far filter' });
    });

    it('should pass icon name to icon', () => {
      expect(wrapper.find('FontAwesomeIcon-stub').attributes().icon).toContain('filter');
    });

    it('should also pass style to icon', () => {
      expect(wrapper.find('FontAwesomeIcon-stub').attributes().icon).toContain('far');
    });
  });
});

// This import test that icons are correctly registered
import '@/lib/icons';

describe('font-awesome icons library', () => {
  const logErrorSpy = jest.spyOn(console, 'error');

  it('should make icons from the library available', () => {
    mount(FAIcon, {
      propsData: {
        icon: 'filter',
      },
    });
    expect(logErrorSpy).not.toHaveBeenCalled();
  });

  it('should log an error for icons that are not in the library', () => {
    mount(FAIcon, {
      propsData: {
        icon: 'far filter',
      },
    });
    expect(logErrorSpy).toHaveBeenCalled();
    expect(logErrorSpy.mock.calls[0][0]).toEqual('Could not find one or more icon(s)');
  });
});
