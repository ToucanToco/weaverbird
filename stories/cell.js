import { storiesOf } from '@storybook/vue'

import { Cell } from '../dist/storybook/components'

const stories = storiesOf('Cell', module)

stories
  .add('simple', () => ({
    components: { Cell },
    props: {
      row: {
        default() {
          return {
            column: "Some content"
          }
        }
      }
    },
    template: `
      <cell
        :row="row"
        :column="'column'"
      >
      </cell>
    `
  }))
