export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Fillna step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['fillna'],
    },
    column: {
      type: 'string',
      minLength: 1,
      title: 'Column in which to fill null values',
      description: 'Column in which to fill null values',
      attrs: {
        placeholder: 'Enter a column',
      },
    },
    value: {
      type: 'string',
      minLength: 0,
      title: 'The value used to fill nulls',
      description: 'The value used to fill nulls',
      attrs: {
        placeholder: 'Enter a value',
      },
    },
  },
  required: ['name', 'column', 'value'],
  additionalProperties: false,
};
