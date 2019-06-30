export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Domain column step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['domain'],
    },
    domain: {
      type: 'string',
      minLength: 1,
      title: "domain's name",
      description: "domain's name",
      attrs: {
        placeholder: 'Choose a domain',
      },
    },
  },
  required: ['name', 'domain'],
  additionalProperties: false,
};
