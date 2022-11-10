export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Waterfall step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      const: 'waterfall',
    },
    valueColumn: {
      type: 'string',
      minLength: 1,
      title: 'Value column name',
      description: 'The name of the value column used to compute waterfall blocks values',
    },
    milestonesColumn: {
      type: 'string',
      minLength: 1,
      title: 'Column incl. start and end blocks labels (generally dates)',
      description:
        'Column including the labels of the starting and ending blocks of the waterfall (generally dates)',
    },
    start: {
      type: 'string',
      minLength: 1,
      title: 'Starting block label',
      description: 'The label of the starting milestone to find in the milestone column',
    },
    end: {
      type: 'string',
      minLength: 1,
      title: 'Ending block label',
      description: 'The label of the ending milestone to find in the milestone column',
    },
    labelsColumn: {
      type: 'string',
      minLength: 1,
      title: 'Labels column (for intermediate blocks)',
      description: 'The name of the column where to find children labels',
    },
    parentsColumn: {
      type: 'string',
      minLength: 1,
      title: '(Optional) Parents labels column (for drill)',
      description: 'The name of the column where to find parent labels if any',
    },
    groupby: {
      type: 'array',
      items: {
        type: 'string',
        minLength: 1,
      },
      title: 'Group by',
      description: 'The columns used to group waterfall computation',
    },
    sortBy: {
      type: 'string',
      title: 'Sort order',
      enum: ['label', 'value'],
      description:
        'Whether to sort waterfall blocks depending on labels alphabetical order or values order',
    },
    order: {
      type: 'string',
      title: 'Sort order',
      enum: ['asc', 'desc'],
      description:
        'Whether to use ascending or descending order when applying the "sortBy" parameter',
    },
  },
  required: [
    'name',
    'valueColumn',
    'milestonesColumn',
    'start',
    'end',
    'labelsColumn',
    'sortBy',
    'order',
  ],
  additionalProperties: false,
};
