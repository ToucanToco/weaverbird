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
    columnToPivot: {
      type: 'string',
      minLength: 1,
      title: 'Column to pivot',
      description: 'The column to pivot',
      attrs: {
        placeholder: 'Select a column',
      },
    },
    valueColumn: {
      type: 'string',
      minLength: 1,
      title: 'Value colum...',
      description: 'Column on which aggregate function will apply',
      attrs: {
        placeholder: 'Select a column',
      },
    },
    aggFunction: {
      type: 'string',
      enum: ['sum', 'avg', 'count', 'min', 'max'],
    },
  },
  required: ['name', 'index', 'columnToPivot', 'valueColumn', 'aggFunction'],
  additionalProperties: false,
};
