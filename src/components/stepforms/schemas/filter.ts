export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Filter schema',
  type: 'object',
  properties: {
    name: {
      type: 'string',
      enum: ['filter'],
    },
    condition: {
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
  definitions: {
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
            'from',
            'until',
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
  },
  required: ['name', 'condition'],
  additionalProperties: false,
};
