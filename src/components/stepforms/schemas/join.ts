export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Join step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['join'],
    },
    right_pipeline: {
      type: 'string',
      minLength: 1,
      title: 'Right dataset',
      description: 'Select a dataset to join (as right dataset):',
      attrs: {
        placeholder: 'Select a dataset',
      },
    },
    type: {
      type: 'string',
      enum: ['left', 'inner'],
      title: 'Join type',
      description: 'Select a join type:',
      attrs: {
        placeholder: 'Select a join type',
      },
    },
    on: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'array',
        minItems: 2,
        maxItems: 2,
        items: {
          type: 'string',
          minLength: 1,
        },
      },
      title: 'Datasets columns to match',
      description: 'Select current and right datasets columns to match',
      attrs: {
        placeholder: 'Select column(s)',
      },
    },
  },
  required: ['name', 'right_pipeline', 'type', 'on'],
  additionalProperties: false,
};
