export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Formula step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['formula'],
    },
    formula: {
      type: 'string',
      minLength: 1,
      title: 'Formula',
      description: 'Formula',
      attrs: {
        placeholder: 'Enter a formula',
      },
    },
    newColumn: {
      type: 'string',
      minLength: 1,
      title: 'New column name',
      description: 'New column name',
      attrs: {
        placeholder: 'Enter a new column name',
      },
    },
  },
  required: ['name', 'formula', 'newColumn'],
  additionalProperties: false,
};
