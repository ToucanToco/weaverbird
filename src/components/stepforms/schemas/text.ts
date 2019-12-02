export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Add text column step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['text'],
    },
    text: {
      type: 'string',
      minLength: 1,
      title: 'Text',
      description: 'Text',
      attrs: {
        placeholder: 'Enter a text',
      },
    },
    new_column: {
      type: 'string',
      minLength: 1,
      title: 'New column name',
      description: 'New column name',
      attrs: {
        placeholder: 'Enter a new column name',
      },
    },
  },
  required: ['name', 'text', 'new_column'],
  additionalProperties: false,
};
