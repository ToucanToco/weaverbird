import { mount } from '@vue/test-utils';
import ActionMenu from '@/components/ActionMenu.vue';

describe('Action Menu', () => {
  it('should instantiate with its popover hidden', () => {
    const wrapper = mount(ActionMenu);

    expect(wrapper.exists()).toBeTruthy();
    expect(wrapper.classes()).not.toContain('popover--active');
  });

  it('should instantiate with the popover active', () => {
    const wrapper = mount(ActionMenu, {
      propsData: {
        isActive: true,
      },
    });

    expect(wrapper.classes()).toContain('popover--active');
  });

  it('should have an "Rename column" action', () => {
    const wrapper = mount(ActionMenu);
    expect(wrapper.html()).toContain('Rename column');
  });

  describe('when click on "Rename column"', () => {
    it('should emit an "actionClicked" event', () => {
      const wrapper = mount(ActionMenu);
      const actionsWrapper = wrapper.findAll('.action-menu__option');
      actionsWrapper.at(1).trigger('click');

      expect(wrapper.emitted().actionClicked).toBeTruthy();
    });

    it('shoud emit an "actionClicked" with the oldname already filled', () => {
      const wrapper = mount(ActionMenu, {
        propsData: {
          columnName: 'dreamfall',
        },
      });
      const actionsWrapper = wrapper.findAll('.action-menu__option');
      actionsWrapper.at(1).trigger('click');

      expect(wrapper.emitted().actionClicked[0]).toEqual([
        { name: 'rename', oldname: 'dreamfall' },
      ]);
    });
  });
});
