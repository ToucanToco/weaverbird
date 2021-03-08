import aggregations from './aggregations';

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Rollup step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      const: 'rollup',
    },
    hierarchy: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'hierarchal columns',
      description: 'The hierarchy of columns, from lowest to highest level',
      attrs: {
        placeholder: 'Add columns',
      },
    },
    aggregations,
    groupby: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'Group by',
      description: 'The columns used to group rollup computation',
      attrs: {
        placeholder: 'Add columns',
      },
    },
    labelCol: {
      type: ['null', 'string'],
      minLength: 1,
      title: 'Label column name',
      description: 'The name of the label column that will be created',
      attrs: {
        placeholder: 'label',
      },
    },
    levelCol: {
      type: ['null', 'string'],
      minLength: 1,
      title: 'Level column name',
      description: 'The name of the level column that will be created',
      attrs: {
        placeholder: 'level',
      },
    },
    parentLabelCol: {
      type: ['null', 'string'],
      minLength: 1,
      title: 'Parent column name',
      description: 'The name of the parent column that will be created',
      attrs: {
        placeholder: 'parent',
      },
    },
  },
  required: ['name', 'hierarchy', 'aggregations'],
  additionalProperties: false,
};
