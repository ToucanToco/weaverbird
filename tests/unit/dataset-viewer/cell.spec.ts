import { mount, Wrapper } from '@vue/test-utils'
import Cell from '@/components/dataset-viewer/Cell.vue'

describe('Cell.vue', () => {
  let wrapper!: Wrapper<Cell>

  describe('simple', () => {
    beforeEach( () => {
      wrapper = mount(Cell, {
        propsData: {
          column: 'col1',
          row: {
            col1: 'val1'
          }
        },
      })
    })

    it('should render a simple value', () => {
      expect(wrapper.text()).toEqual('val1')
    })

    it('should add its detected type as DOM pop and title', () => {
      expect(wrapper.attributes('title')).toEqual('String')
      expect(wrapper.attributes('data-type')).toEqual('String')
    })
  })

  describe('formatted', () => {
    beforeEach(() => {
      wrapper = mount(Cell, {
        propsData: {
          column: 'col1',
          row: {
            col1: 'val1'
          },
          displayFormatted: true,
          formatter: (val: any) => val.toString().toUpperCase()
        },
      })
    })

    it('should render the formatted value', () => {
      expect(wrapper.text()).toEqual('VAL1')
    })

    it('should have the modifier class', () => {
      expect(wrapper.classes()).toContain('dataset-viewer__cell--formatted')
    })
  })

  describe('with modifiers', () => {
    beforeEach(() => {
      wrapper = mount(Cell, {
        propsData: {
          column: 'col1',
          row: {
            col1: 'val1'
          },
          classModifiers: [
            function(val: any) {
              if (val === 'val1') {
                return 'present-on-val1'
              }
            },
            function (val: any) {
              return 'always-present'
            },
            function (val: any) {
              if (val === 'nope') {
                return 'never-present'
              }
            },
          ]
        },
      })
    })

    it('should add class modifiers', () => {
      expect(wrapper.classes()).toContain('dataset-viewer__cell--always-present')
    })
  })
})
