export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Pivot step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['pivot'],
    },
    index: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'Index',
      description: 'The columns name used as index',
      attrs: {
        placeholder: 'Select columns',
      },
    },
    column_to_pivot: {
      type: 'string',
      minLength: 1,
      title: 'Column to pivot',
      description: 'The column to pivot',
      attrs: {
        placeholder: 'Select a column',
      },
    },
    value_column: {
      type: 'string',
      minLength: 1,
      title: 'Value colum...',
      description: 'Column on which aggregate function will apply',
      attrs: {
        placeholder: 'Select a column',
      },
    },
    agg_function: {
      type: 'string',
      enum: ['sum', 'avg', 'count', 'min', 'max'],
    },
  },
  required: ['name', 'index', 'column_to_pivot', 'value_column', 'agg_function'],
  additionalProperties: false,
};
