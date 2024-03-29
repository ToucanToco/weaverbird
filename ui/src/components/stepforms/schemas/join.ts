export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Join step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['join'],
    },
    rightPipeline: {
      title: 'Right dataset',
      description: 'Select a dataset to join (as right dataset):',
      attrs: {
        placeholder: 'Select a dataset',
      },
      anyOf: [
        {
          type: 'string',
          minLength: 1,
        },
        {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['ref'],
            },
            uid: { type: 'string', minLength: 1 },
          },
          required: ['uid', 'type'],
        },
      ],
    },
    type: {
      type: 'string',
      enum: ['left', 'inner', 'left outer'],
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
  required: ['name', 'rightPipeline', 'type', 'on'],
  additionalProperties: false,
};
