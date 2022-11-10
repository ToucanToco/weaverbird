export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Custom step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['custom'],
    },
    query: {
      type: 'string',
      minLength: 1,
      title: 'Query',
      description: 'Write a query',
    },
  },
  required: ['name', 'query'],
  additionalProperties: false,
};
