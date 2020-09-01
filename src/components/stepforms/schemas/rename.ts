export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Rename step',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['rename'],
    },
    toRename: {
      type: 'array',
      items: {
        type: 'array',
        items: {
          type: 'string',
          minLength: 1,
        },
        minItems: 2,
        maxItems: 2,
      },
      minItems: 1,
      title: 'To rename',
      description:
        'A list of 2-values list, the first one being the column name to replace,\
        the second one being the new column name',
    },
    // The following parameters are optional and are accepted for retrocompatibility purposes only
    oldname: {
      type: 'string',
      minLength: 1,
      title: 'Current column name',
      description: 'The name of the column you want to modify.',
      attrs: {
        placeholder: 'Enter a column name to replace',
      },
    },
    newname: {
      type: 'string',
      minLength: 1,
      title: 'New column name',
      description: 'The new name of the column',
      attrs: {
        placeholder: 'Enter a new column name',
      },
    },
  },
  required: ['name', 'toRename'],
  additionalProperties: false,
};
