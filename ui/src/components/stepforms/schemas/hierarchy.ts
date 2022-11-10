export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Hierarchy step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['hierarchy'],
    },
    hierarchyLevelColumn: {
      type: 'string',
      minLength: 1,
      title: 'Hierarchy level column',
      description: 'The hierarchy level column',
      attrs: {
        placeholder: 'hierarchy level column',
      },
    },
    hierarchy: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'Add hierarchy',
      description: 'The columns used create the hierarchy',
      attrs: {
        placeholder: 'Add hierarchy',
      },
    },
    includeNulls: {
      type: 'boolean',
      description: 'If true, include null values',
    },
  },
  required: ['name', 'hierarchyLevelColumn', 'hierarchy'],
  additionalProperties: false,
};
