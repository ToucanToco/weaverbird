export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Absolute value step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['absolutevalue'],
    },
    column: {
      type: 'string',
      minLength: 1,
      title: 'Input column',
      description: 'Input column',
      attrs: {
        placeholder: 'Select a column',
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
  required: ['name', 'column', 'newColumn'],
  additionalProperties: false,
};
