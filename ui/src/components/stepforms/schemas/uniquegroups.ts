export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Get unique groups/values step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['uniquegroups'],
    },
    on: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'Get unique groups/values in columns:',
      description: 'The columns used to make groups',
      attrs: {
        placeholder: 'Add columns',
      },
    },
  },
  required: ['name', 'on'],
  additionalProperties: false,
};
