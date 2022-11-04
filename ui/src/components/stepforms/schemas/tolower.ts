export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Convert column to lowercase',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['lowercase'],
    },
    column: {
      type: 'string',
      minLength: 1,
      title: 'Column to convert',
      description: 'Column to convert',
      attrs: {
        placeholder: 'Enter a column',
      },
    },
  },
  required: ['name', 'column'],
  additionalProperties: false,
};
