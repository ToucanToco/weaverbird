export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Convert column data type step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['convert'],
    },
    columns: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'Convert columns:',
      description: 'Columns to convert',
      attrs: {
        placeholder: 'Select column(s)',
      },
    },
    data_type: {
      type: 'string',
      enum: ['integer', 'float', 'text', 'date', 'boolean'],
      title: 'Data type',
      description: 'Data type to convert into',
      placeholder: 'Select a data type',
    },
  },
  required: ['name', 'columns', 'data_type'],
  additionalProperties: false,
};
