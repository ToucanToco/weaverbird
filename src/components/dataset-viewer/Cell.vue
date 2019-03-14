<script lang="ts">
import _ from 'lodash'
import Vue from 'vue'

import detectType from './detect-type'

const defaultFormatter = (value: any, row: object, column: string) =>
  _.isObject(value) ? JSON.stringify(value) : _.toString(value)

const CSS_CLASS = 'dataset-viewer__cell'

export default Vue.extend({
  name: 'dataset-viewer-cell',

  props: {
    column: {},
    row: {},
    displayFormatted: {
      default: false,
      type: Boolean
    },
    formatter: {
      default: defaultFormatter,
      type: Function
    },
    classModifiers: {
      default: () => [],
      type: Array
    },
  },

  functional: true,

  render (createElement, ctx) {
    let value = ctx.props.row[ctx.props.column]
    let classes = [CSS_CLASS]
    let type = detectType(value)

    let displayedValue
    if (ctx.props.displayFormatted) {
      classes.push(`${CSS_CLASS}--formatted`)
      displayedValue = ctx.props.formatter(value, ctx.props.row, ctx.props.column)
    } else {
      displayedValue = defaultFormatter(value, ctx.props.row, ctx.props.column)
    }

    classes = classes.concat(
      ctx.props.classModifiers
        .map( (generateClassModifier: Function) =>
          generateClassModifier(value, ctx.props.row, ctx.props.column)
        )
        // Filter out modifiers who generated nothing
        .filter( (modifier: string | undefined) => modifier )
        .map( (modifier: string) => `${CSS_CLASS}--${modifier}` )
    )

    return createElement('div', {
      class: classes,
      domProps: {
        title: type
      },
      attrs: {
        'data-type': type
      },
    }, displayedValue)
  }
})
</script>

<style lang="scss" scoped>
  @import '../../styles/Cell';
</style>

