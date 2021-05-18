export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'If...Then...Else schema',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['ifthenelse'],
    },
    newColumn: {
      type: 'string',
      minLength: 1,
      title: 'New column',
      description: 'New column',
      attrs: {
        placeholder: 'Enter a column name',
      },
    },
    if: { $ref: '#/definitions/if' },
    then: { $ref: '#/definitions/formula' },
    else: { $ref: '#/definitions/else' },
  },
  definitions: {
    if: {
      if: { required: ['column'] },
      then: {
        $ref: '#/definitions/simpleCondition',
      },
      else: {
        if: { required: ['or'] },
        then: {
          $ref: '#/definitions/orCondition',
        },
        else: {
          if: { required: ['and'] },
          then: {
            $ref: '#/definitions/andCondition',
          },
        },
      },
    },
    else: {
      anyOf: [
        { $ref: '#/definitions/formula' },
        {
          type: 'object',
          properties: {
            if: { $ref: '#/definitions/if' },
            then: { $ref: '#/definitions/formula' },
            else: { $ref: '#/definitions/else' },
          },
          required: ['if', 'then', 'else'],
          additionalProperties: false,
        },
      ],
    },
    andCondition: {
      properties: {
        and: {
          type: 'array',
          minItems: 1,
          title: 'And condition',
          items: {
            if: { required: ['column'] },
            then: {
              $ref: '#/definitions/simpleCondition',
            },
            else: {
              if: { required: ['or'] },
              then: {
                $ref: '#/definitions/orCondition',
              },
              else: {
                if: { required: ['and'] },
                then: {
                  $ref: '#/definitions/andCondition',
                },
              },
            },
          },
        },
      },
      required: ['and'],
      additionalProperties: false,
    },
    orCondition: {
      properties: {
        or: {
          type: 'array',
          minItems: 1,
          title: 'Or condition',
          items: {
            if: { required: ['column'] },
            then: {
              $ref: '#/definitions/simpleCondition',
            },
            else: {
              if: { required: ['or'] },
              then: {
                $ref: '#/definitions/orCondition',
              },
              else: {
                if: { required: ['and'] },
                then: {
                  $ref: '#/definitions/andCondition',
                },
              },
            },
          },
        },
      },
      required: ['or'],
      additionalProperties: false,
    },
    simpleCondition: {
      type: 'object',
      properties: {
        column: {
          type: 'string',
          minLength: 1,
          title: 'Column name',
          description: 'The name of the column you want to filter on.',
          attrs: {
            placeholder: 'Enter the column name',
          },
        },
        value: {
          type: ['string', 'number', 'boolean', 'null', 'array', 'object'],
          minLength: 1,
          title: 'Value',
          description: 'The value to compare',
          attrs: {
            placeholder: 'Enter a value',
          },
        },
        operator: {
          type: 'string',
          enum: [
            'eq',
            'ne',
            'gt',
            'ge',
            'lt',
            'le',
            'in',
            'nin',
            'matches',
            'notmatches',
            'isnull',
            'notnull',
          ],
          title: 'Operator',
          description: 'The filter operator',
          attrs: {
            placeholder: 'Choose the filter operator',
          },
        },
      },
      required: ['column', 'operator'],
      additionalProperties: false,
    },
    formula: {
      type: ['string', 'number'],
      minLength: 1,
      title: 'Formula',
      description: 'Formula',
      attrs: {
        placeholder: 'Enter a formula',
      },
    },
  },
  required: ['name', 'newColumn', 'if', 'then', 'else'],
  additionalProperties: false,
};
