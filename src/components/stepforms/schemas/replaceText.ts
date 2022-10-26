export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Replace text step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['replacetext'],
    },
    searchColumn: {
      type: 'string',
      minLength: 1,
      title: 'Search',
      description: 'Column in which to replace text',
      attrs: {
        placeholder: 'Enter a column',
      },
    },
    oldStr: {
      type: 'string',
      description: 'String to replace',
      minLength: 1,
    },
    newStr: {
      type: 'string',
      description: 'Value to use as a placeholder',
    },
  },
  required: ['name', 'searchColumn', 'oldStr'],
  additionalProperties: false,
};
