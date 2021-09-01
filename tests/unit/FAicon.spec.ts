import { shallowMount, Wrapper } from '@vue/test-utils';

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
    expect(wrapper.find('FontAwesomeIcon-stub').attributes().icon).toContain('filter');
  });
  it('should pass default style to icon', () => {
    expect(wrapper.find('FontAwesomeIcon-stub').attributes().icon).toContain('fas');
  });

  describe('with specific style', () => {
    beforeEach(() => {
      wrapper.setProps({ styles: 'far' });
    });
    it('should pass style to icon', () => {
      expect(wrapper.find('FontAwesomeIcon-stub').attributes().icon).toContain('far');
    });
  });
});
