export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Replace step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['replace'],
    },
    searchColumn: {
      type: 'string',
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'Search',
      description: 'Columns in which to search values to replace',
      attrs: {
        placeholder: 'Enter a column',
      },
    },
    toReplace: {
      type: 'array',
      items: {
        type: 'array',
        items: {
          type: ['string', 'number', 'boolean'],
          minItems: 2,
          maxItems: 2,
        },
        minItems: 1,
      },
      minItems: 1,
      title: 'To replace',
      description: 'Values to replace',
    },
  },
  required: ['name', 'searchColumn', 'toReplace'],
  additionalProperties: false,
};
