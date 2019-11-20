export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Append step',
  type: 'object',
  properties: {
    pipelines: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'Datasets to append',
      description: 'The name of the pipelines to append',
      attrs: {
        placeholder: 'Select datasets',
      },
    },
  },
  required: ['pipelines'],
  additionalProperties: false,
};
