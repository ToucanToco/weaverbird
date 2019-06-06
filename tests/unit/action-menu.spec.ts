import { expect } from 'chai';
import { mount } from '@vue/test-utils';
import ActionMenu from '@/components/ActionMenu.vue';

describe('Action Menu', () => {
  it('should instantiate with its popover hidden', () => {
    const wrapper = mount(ActionMenu);

    expect(wrapper.exists()).to.be.true;
    expect(wrapper.classes()).not.to.contain('popover--active');
  });

  it('should instantiate with the popover active', () => {
    const wrapper = mount(ActionMenu, {
      propsData: {
        isActive: true,
      },
    });

    expect(wrapper.classes()).to.contain('popover--active');
  });

  it('should have an "Rename column" action', () => {
    const wrapper = mount(ActionMenu);
    expect(wrapper.html()).to.contain('Rename column');
  });

  it('should have an "Fill null values" action', () => {
    const wrapper = mount(ActionMenu);
    expect(wrapper.html()).toContain('Fill null values');
  });

  describe('when click on "Rename column"', () => {
    it('should emit an "actionClicked" event with proper options', () => {
      const wrapper = mount(ActionMenu, {
        propsData: {
          columnName: 'dreamfall',
        },
      });
      const actionsWrapper = wrapper.findAll('.action-menu__option');
      actionsWrapper.at(1).trigger('click');

      expect(wrapper.emitted().actionClicked).to.be.true;
      expect(wrapper.emitted().actionClicked[0]).to.eql([
        { name: 'rename', oldname: 'dreamfall', newname: '' },
      ]);
    });
  });

  describe('when click on "Fill null values"', () => {
    it('should emit an "actionClicked" event with proper options', () => {
      const wrapper = mount(ActionMenu, {
        propsData: {
          columnName: 'dreamfall',
        },
      });
      const actionsWrapper = wrapper.findAll('.action-menu__option');
      actionsWrapper.at(3).trigger('click');

      expect(wrapper.emitted().actionClicked[0]).to.eql([
        { name: 'fillna', column: 'dreamfall', value: '' },
      ]);
    });
  });
});
