export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Simplify step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['simplify'],
    },
    tolerance: {
      type: 'number',
      description: 'All parts of the simplified geometry will be no more than this distance',
    },
  },
  required: ['name', 'tolerance'],
  additionalProperties: false,
};
