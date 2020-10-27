import {PandasDataTable, pandasDataTableToDataset} from '@/lib/dataset/pandas';

describe('pandasDataTableToDataset', () => {
  it('should convert a table from pandas to a DataSet', () => {
    const dataTable: PandasDataTable = {
      schema: {
        fields: [{
          name: 'label',
          type: 'string',
        }, {
          name: 'value',
          type: 'number'
        }]
      },
      data: [
        {
          label: 'A',
          value: 42
        }, {
          label: 'B',
          value: 69
        }
      ]
    }

    expect(pandasDataTableToDataset(dataTable)).toEqual({
      headers:[{
          name: 'label',
          type: 'string',
        }, {
          name: 'value',
          type: 'float'
        }],
      data: [
        ['A', 42],
        ['B', 69]
      ]
    });
  });
});
