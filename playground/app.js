/* eslint-disable @typescript-eslint/no-var-requires */
const {
  Vqb,
  VQBnamespace,
  VQB_MODULE_NAME,
  filterOutDomain,
  getTranslator,
  mongoResultsToDataset,
  dereferencePipelines,
  servicePluginFactory,
  registerModule,
  setCodeEditor,
} = vqb;

const TRANSLATOR = 'mongo40';

const mongo40translator = getTranslator(TRANSLATOR);

// Example to set a custom editor:
// This one is quite simple. It customizes the placeholder.
setCodeEditor({
  props:['value', 'placeholder'],
  render(createElement) {
    return createElement("textarea", {
      domProps: {
        value: this.value,
        placeholder: "OMG I have to write code in here",
      },
      attrs: {
        type: "text"
      },
      on: {
        input: (event) => {this.$emit('input', event.target.value)},
        blur: (event) => {this.$emit('blur')},
        focus: (event) => {this.$emit('focus')},
      },
    })
  },
});

/**
* "mingo" is missing two important mongo operator:
* - $type
* - $convert
* Fortunately it expose a convenient api to implement them.
* https://github.com/kofrasa/mingo/wiki/Custom-Operators
*/
mingo.addOperators(mingo.OP_EXPRESSION, function (_) {
  return {
    '$type': function (collection, expr) {
      // https://docs.mongodb.com/manual/reference/operator/aggregation/type
      const value = collection._vqbAppArray.v
      if(_.isArray(value)){
        return 'array'
      }
      if(_.isObject(value)){
        return 'object'
      }
      if(_.isBoolean(value)){
        return 'bool'
      }
      if(_.isNumber(value)){
        return Number.isInteger(value) ? 'long' : 'double'
      }
      if(_.isRegExp(value)){
        return 'regex'
      }
      if(_.isString(value)){
        return 'string'
      }
      return ''
    },
    '$convert': function (collection, expr) {
      //https://docs.mongodb.com/manual/reference/operator/aggregation/convert
      const _converter = {
        "double": (e) => parseFloat(e),
        "decimal": (e) => parseFloat(e),
        "int": (e) => parseInt(e),
        "long": (e) => parseInt(e),
        "string": (e) => ""+e,
      }
      const _id = (e) => e;
      console.log('collection', collection, expr);
      return  (_converter[expr.to] || _id)(collection[expr.input.replace("$", "")]);
    },
  };
});

/**
* Database and Collection are helper classes to imitate a Mongo Database
* Collection uses `mingo` to run an aggregation pipeline.
*/
class Database {
  get listCollections(){
    return Object.keys(this)
  };
}

class Collection {
  constructor(values){
    this.values = values;
  };

  aggregate(pipeline){
    const agg = new mingo.Aggregator(pipeline);
    return agg.run(this.values)
  };
};

// DATABASE is a global variable uses to store and query the "pseudo" mongo collection.
// Also, it might be useful to access it in console
window.DATABASE = new Database();

DATABASE['test-collection'] = new Collection([
  { Label: "Label 1", Value1: 10, Groups: "Group 1"},
  { Label: "Label 2", Value1: 1, Groups: "Group 1"},
  { Label: "Label 3", Value1: 5, Groups: "Group 2"},
  { Label: "Label 4", Value1: 7, Groups: "Group 3"},
  { Label: "Label 5", Value1: undefined, Groups: "Group 1"},
]);

const CASTERS = {
  date: val => new Date(val),
};

function mongoToVQBType(type) {
  if (type === 'int' || type === 'long') {
    return 'integer';
  }
  if (type === 'double' || type === 'decimal') {
    return 'float';
  }
  if (type === 'bool') {
    return 'boolean';
  }
  if (type === 'date' || type === 'string' || type === 'object') {
    return type;
  }
  return undefined;
}

function annotateDataset(dataset, typeAnnotations) {
  const typedHeaders = dataset.headers.map(hdr => ({
    name: hdr.name,
    type: typeAnnotations ? mongoToVQBType(typeAnnotations[hdr.name]) : undefined,
  }));
  return {
    ...dataset,
    headers: typedHeaders,
  };
}

function autocastDataset(dataset) {
  // inspect column types to find out which ones should be casted, that is which
  // ones are annotated with registered casters.
  const columnCasters = [];
  for (const [idx, hdr] of Object.entries(dataset.headers)) {
    if (CASTERS[hdr.type]) {
      columnCasters.push([idx, CASTERS[hdr.type]]);
    }
  }
  // If there's no need to cast anything, let us be lazy and return the original
  // dataset.
  if (!columnCasters.length) {
    return dataset;
  }
  // Otherwise, apply cast on each required column
  const newData = [];
  for (const row of dataset.data) {
    const newRow = [...row];
    for (const [idx, caster] of columnCasters) {
      newRow[idx] = caster(newRow[idx]);
    }
    newData.push(newRow);
  }
  return {
    ...dataset,
    data: newData,
    headers: dataset.headers,
  };
}

class MongoService {
  listCollections(_store) {
    return DATABASE.listCollections;
  }

  executePipeline(_store, pipeline, limit, offset = 0) {
    const { domain, pipeline: subpipeline } = filterOutDomain(pipeline);
    const query = mongo40translator.translate(subpipeline);
    const { isResponseOk, responseContent } = this.executeQuery(query, domain, limit, offset);

    if (isResponseOk) {
      const [{ count, data: rset, types }] = responseContent;
      let dataset = mongoResultsToDataset(rset);
      dataset.paginationContext = {
        totalCount: count,
        pagesize: limit,
        pageno: Math.floor(offset / limit) + 1,
      };
      if (types && types.length) {
        dataset = annotateDataset(dataset, types[0]);
        dataset = autocastDataset(dataset);
      }
      return {
        data: dataset,
      };
    } else {
      return {
        error: responseContent.errmsg,
      };
    }
  }

  /**
  * Transform an aggregation query into a `$facet` one so that we can get in a single
  * query both total query count (independently of `$limit` or `$skip` operators) and
  * the query results.
  *
  * @param {Array} query the initial aggregation query
  * @return the transformed `$facet` query
  */
  facetize(query, limit, skip) {
    if (!query.length) {
      query.push({
        $match: {},
      });
    }
    return [
      ...query,
      {
        $facet: {
          stage1: [{
            $group: {
              _id: null,
              count: {
                $sum: 1,
              },
            },
          }, ],
          stage2: [{
            $skip: skip,
          },
          {
            $limit: limit,
          },
          ],
          stage3: [{
            $skip: skip,
          }, {
            $limit: limit,
          },
          {
            $group: {
              _id: null,
              _vqbAppArray: {
                $push: '$$ROOT'
              }
            }
          },
          {
            $unwind: {
              path: "$_vqbAppArray",
              includeArrayIndex: "_vqbAppIndex"
            }
          },
          {
            $project: {
              _vqbAppArray: {
                $objectToArray: '$_vqbAppArray',
              },
              _vqbAppIndex: 1
            },
          },
          {
            $unwind: '$_vqbAppArray',
          },
          {
            $project: {
              column: '$_vqbAppArray.k',
              type: {
                $type: '$_vqbAppArray.v',
              },
              _vqbAppIndex: 1
            },
          },
          {
            $group: {
              _id: '$_vqbAppIndex',
              _vqbAppArray: {
                $addToSet: {
                  column: '$column',
                  type: '$type',
                },
              },
            },
          },
          {
            $project: {
              _vqbAppTmpObj: {
                $arrayToObject: {
                  $zip: {
                    inputs: ['$_vqbAppArray.column', '$_vqbAppArray.type'],
                  },
                },
              },
            },
          },
          {
            $replaceRoot: {
              newRoot: '$_vqbAppTmpObj',
            },
          },
          ],
        },
      },

      {
        $unwind: '$stage1',
      },

      //output projection
      {
        $project: {
          count: '$stage1.count',
          data: '$stage2',
          types: '$stage3',
        },
      },
    ];
  }

  executeQuery(query, collection, limit, skip) {
    try{
      const responseContent = DATABASE[collection].aggregate(this.facetize(query));
      return {
        isResponseOk: true,
        responseContent
      };
    }catch(error){
      return {
        isResponseOk: false,
        responseContent: error,
      };
    }
  }

  async loadCSV(file) {
    const fileText = await file.text();

    // parse csv
    // TODO: find a csv parser
    let [columns, ...rows] = fileText.split("\n");
    columns = columns.split(",");
    rows = rows.map((row)=>row.split(","));
    const json = rows.map((row)=> columns.reduce((obj, c, i) => ({...obj, [c]: row[i] }), {}) );
    // ---

    DATABASE[file.name] = new Collection(json);
    return { collection: file.name }
  }
}

const mongoservice = new MongoService();
const mongoBackendPlugin = servicePluginFactory(mongoservice);
const initialPipeline = [
  {
    name: 'domain',
    domain: 'test-collection',
  },
  {
    name: 'filter',
    condition: {
      and: [
        {
          column: 'Groups',
          value: '<%= groupname %>',
          operator: 'eq',
        },
      ],
    },
  },
];

function setupInitialData(store, domain = null) {
  const collections = mongoservice.listCollections();
  store.commit(VQBnamespace('setDomains'), {
    domains: collections,
  });
  if (domain !== null) {
    store.commit(VQBnamespace('setCurrentDomain'), {
      currentDomain: domain,
    });
  } else {
    const response = mongoservice.executePipeline(
      store,
      store.state[VQB_MODULE_NAME].pipeline,
      store.state[VQB_MODULE_NAME].pagesize,
    );
    if (response.error) {
      store.commit(VQBnamespace('logBackendError'), {
        backendError: {
          type: 'error',
          error: response.error,
        },
      });
    } else {
      store.commit(VQBnamespace('setDataset'), {
        dataset: response.data,
      });
    }
  }
}

async function buildVueApp() {
  Vue.use(Vuex);
  const store = new Vuex.Store({
    plugins: [mongoBackendPlugin],
  });

  new Vue({
    el: '#app',
    components: {
      Vqb,
    },
    store,
    data: function() {
      return {
        isCodeOpened: false,
        draggedOverFirst: false,
        draggedOverSecond: false,
        draggedover: false,
      };
    },
    created: function() {
      registerModule(this.$store, {
        pipeline: initialPipeline,
        pipelines: {
          pipeline1: [
            {
              name: 'domain',
              domain: 'test-collection',
            },
            {
              name: 'replace',
              search_column: 'Label',
              to_replace: [
                ['Label 1', 'Label 6'],
                ['Label 2', 'Label 7'],
                ['Label 3', 'Label 8'],
                ['Label 4', 'Label 9'],
                ['Label 5', 'Label 10'],
              ],
            },
          ],
          pipeline2: [
            {
              name: 'domain',
              domain: 'test-collection',
            },
            {
              name: 'replace',
              search_column: 'Label',
              to_replace: [
                ['Label 1', 'Label 11'],
                ['Label 2', 'Label 12'],
                ['Label 3', 'Label 13'],
                ['Label 4', 'Label 14'],
                ['Label 5', 'Label 15'],
              ],
            },
          ],
          pipelineRight1: [
            {
              name: 'domain',
              domain: 'test-collection',
            },
            {
              name: 'replace',
              search_column: 'Label',
              to_replace: [
                ['Label 4', 'Label 6'],
                ['Label 5', 'Label 7'],
              ],
            },
            {
              name: 'formula',
              formula: 'Value2 * 10',
              new_column: 'ValueRight1',
            },
          ],
          pipelineRight2: [
            {
              name: 'domain',
              domain: 'test-collection',
            },
            {
              name: 'replace',
              search_column: 'Label',
              to_replace: [
                ['Label 1', 'Label 8'],
                ['Label 2', 'Label 9'],
                ['Label 3', 'Label 10'],
              ],
            },
            {
              name: 'formula',
              formula: 'Value3 * 10',
              new_column: 'ValueRight2',
            },
          ],
        },
        currentDomain: 'test-collection',
        translator: TRANSLATOR,
        // use lodash interpolate
        // WARNING: mingo uses underscore. Fortunately, it provides also a template function
        interpolateFunc: (value, context) => _.template(value)(context),
        variables: {
          value1: 2,
          value2: 13,
          groupname: 'Group 1',
        },
      });
      setupInitialData(this.$store);
    },
    computed: {
      code: function() {
        let activePipeline = this.$store.getters[VQBnamespace('activePipeline')];
        const pipelines = this.$store.getters[VQBnamespace('pipelines')];
        if (pipelines) {
          activePipeline = dereferencePipelines(activePipeline, pipelines);
        }
        const query = mongo40translator.translate(activePipeline);
        return JSON.stringify(query, null, 2);
      },
      thereIsABackendError: function() {
        return this.$store.getters[VQBnamespace('thereIsABackendError')];
      },
      backendErrorMessage: function() {
        return this.$store.getters[VQBnamespace('backendErrorMessages')].join('<br/>');
      },
    },
    methods: {
      // both methods below help to detect correctly dragover child element and
      // out on parent element
      dragEnter: function(event) {
        event.preventDefault();
        if (this.draggedOverFirst) {
          this.draggedOverSecond = true;
        } else {
          this.draggedOverFirst = true;
        }
        this.draggedover = true;
      },
      dragLeave: function() {
        if (this.draggedOverSecond) {
          this.draggedOverSecond = false;
        } else if (this.draggedOverFirst) {
          this.draggedOverFirst = false;
        }
        if (!this.draggedOverFirst && !this.draggedOverSecond) {
          this.draggedover = false;
        }
      },
      dragOver: function(event) {
        // Prevent to open file when drop the file
        event.preventDefault();
      },
      drop: async function(event) {
        this.draggedover = false;
        event.preventDefault();
        // For the moment, only take one file and we should also test event.target
        const { collection: domain } = await mongoservice.loadCSV(event.dataTransfer.files[0]);
        setupInitialData(store, domain);
        event.target.value = null;
      },
      hideCode: function() {
        this.isCodeOpened = false;
      },
      openCode: function() {
        this.isCodeOpened = true;
      },
    },
  });
}

document.addEventListener('DOMContentLoaded', () => buildVueApp());
