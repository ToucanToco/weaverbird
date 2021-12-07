/* eslint-disable @typescript-eslint/no-var-requires */
const {
  Vqb,
  VQBnamespace,
  VQB_MODULE_NAME,
  filterOutDomain,
  getTranslator,
  mongoResultsToDataset,
  pandasDataTableToDataset,
  dereferencePipelines,
  registerModule,
  setAvailableCodeEditors,
  defineSendAnalytics,
  exampleInterpolateFunc,
} = vqb;

const args = new URLSearchParams(location.search);

const TRANSLATOR = args.get('backend') || 'mongo50';

const mongoTranslator = getTranslator('mongo50');
const pandasTranslator = getTranslator('pandas');
const snowflakeTranslator = getTranslator('snowflake');

const VARIABLES = {
  view: 'Product 123',
  angeBirthday: new Date('2021-08-08'),
  now: new Date(Date.now()),
  city: 'New York',
  country: 'New Zealand',

  value1: 2,
  value2: 13,
  groupname: 'Group 1',
}

const AVAILABLE_VARIABLES = [
  {
    category: 'App variables',
    label: 'view',
    identifier: 'view',
    value: 'Product 123',
  },
  {
    category: 'Dates',
    label: 'Ange\'s birthday',
    identifier: 'angeBirthday',
    value: VARIABLES.angeBirthday,
  },
  {
    category: 'Dates',
    label: 'Now',
    identifier: 'now',
    value: VARIABLES.now,
  },
  {
    category: 'App variables',
    label: 'date.year',
    identifier: 'date.year',
    value: 2020,
  },
  {
    category: 'Story variables',
    label: 'country',
    identifier: 'country',
    value: 'New Zealand',
  },
  {
    category: 'Story variables',
    label: 'city',
    identifier: 'city',
    value: 'New York',
  },
];

// Create a code editor config for a specific lang
const codeEditorForLang = function(lang) {
  return {
    props: ['value', 'placeholder'],
    render(createElement) {
      return createElement('textarea', {
        domProps: {
          value: this.value,
          placeholder: `OMG I have to write code in ${lang} in here`,
        },
        attrs: {
          type: 'text',
        },
        on: {
          input: event => {
            this.$emit('input', event.target.value);
          },
          blur: event => {
            this.$emit('blur');
          },
          focus: event => {
            this.$emit('focus');
          },
        },
      });
    },
  };
};

// Example to provide custom configs for codeEditor
setAvailableCodeEditors({
  defaultConfig: 'json',
  configs: {
    javascript: codeEditorForLang('javascript'),
    json: codeEditorForLang('json'),
  },
});

// Example to set send analytics method
const sendAnalytics = ({name, value}) => { console.debug('Analytics event send ::', { name, value }) };
defineSendAnalytics(sendAnalytics);

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
  async listCollections() {
    const response = await fetch('/mongo');
    return response.json();
  }

  async executePipeline(pipeline, pipelines, limit, offset = 0) {
    const dereferencedPipeline = dereferencePipelines(pipeline, pipelines);
    const { domain, pipeline: subpipeline } = filterOutDomain(dereferencedPipeline);
    const queryWithVariables = mongoTranslator.translate(subpipeline);
    const query = exampleInterpolateFunc(queryWithVariables, VARIABLES);
    const { isResponseOk, responseContent } = await this.executeQuery(query, domain, limit, offset);

    updateLastExecutedQuery(query);

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
      return { data: dataset };
    } else {
      return {
        error: [{ type: 'error', message: responseContent.errmsg }],
      };
    }
  }

  async executeQuery(query, collection, limit, offset) {
    const response = await fetch('/mongo', {
      method: 'POST',
      body: JSON.stringify({
        query,
        collection,
        limit,
        offset,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return {
      isResponseOk: response.ok,
      responseContent: await response.json(),
    };
  }
}

class PandasService {
  async listCollections() {
    const response = await fetch('/pandas');
    return response.json();
  }

  async executePipeline(pipeline, pipelines, limit, offset = 0) {
    const dereferencedPipeline = dereferencePipelines(pipeline, pipelines);

    // This does not modify the pipeline, but checks if all steps are supported
    pandasTranslator.translate(dereferencedPipeline);

    const dereferencedPipelineWithoutVariables = exampleInterpolateFunc(dereferencedPipeline, VARIABLES);

    const url = new URL(window.location.origin + '/pandas');
    url.searchParams.set('limit', limit);
    url.searchParams.set('offset', offset);

    const response = await fetch(url.toString(), {
      method: 'POST',
      body: JSON.stringify(dereferencedPipelineWithoutVariables),
      headers: {
        'Content-Type': 'application/json',
      },
      parameters: {
        limit: limit,
        offset: offset
      }
    });
    const result = await response.json();

    updateLastExecutedQuery(null);
    if (response.ok) {
      let dataset = pandasDataTableToDataset(result);
      dataset.paginationContext = {
        totalCount: result.total,
        pagesize: limit,
        pageno: Math.floor(offset / limit) + 1,
      };
      dataset = autocastDataset(dataset);
      return { data: dataset };
    } else {
      return {
        error: [{ type: 'error', message: result }],
      };
    }
  }
}

class SnowflakeService {
  async listCollections() {
    const response = await fetch('/snowflake');
    return response.json();
  }

  async executePipeline(pipeline, pipelines, limit, offset = 0) {
    const dereferencedPipeline = dereferencePipelines(pipeline, pipelines);

    // This does not modify the pipeline, but checks if all steps are supported
    snowflakeTranslator.translate(dereferencedPipeline);
    const dereferencedPipelineWithoutVariables = exampleInterpolateFunc(dereferencedPipeline, VARIABLES);

    const url = new URL(window.location.origin + '/snowflake');
    url.searchParams.set('limit', limit);
    url.searchParams.set('offset', offset);

    const response = await fetch(url.toString(), {
      method: 'POST',
      body: JSON.stringify(dereferencedPipelineWithoutVariables),
      headers: {
        'Content-Type': 'application/json',
      },
      parameters: {
        limit: limit,
        offset: offset
      }
    });
    const result = await response.json();

    if (response.ok) {
      let dataset = pandasDataTableToDataset(result);
      dataset.paginationContext = {
        totalCount: result.total,
        pagesize: limit,
        pageno: Math.floor(offset / limit) + 1,
      };
      dataset = autocastDataset(dataset);
      updateLastExecutedQuery(result.query);
      return { data: dataset };
    } else {
      updateLastExecutedQuery(null);
      return {
        error: [{ type: 'error', message: result }],
      };
    }
  }
}

let backendService;
switch (TRANSLATOR) {
  case 'pandas':
    backendService = new PandasService();
    break;
  case 'snowflake':
    backendService = new SnowflakeService();
    break;
  default:
    backendService = new MongoService();
}

let updateLastExecutedQuery = function() {};
async function buildVueApp() {
  Vue.use(Vuex);
  const store = new Vuex.Store({});

  const vm = new Vue({
    el: '#app',
    components: {
      Vqb,
    },
    store,
    data: function() {
      return {
        isCodeOpened: false,
        lastExecutedQuery: undefined,
      };
    },
    created: async function() {
      registerModule(this.$store, {
        currentPipelineName: 'pipeline',
        pipelines: {
          // Identifiers for Snowflake (SQL) should be uppercase (no support for other casing for now)
          pipeline: [
            {
              name: 'domain',
              domain: TRANSLATOR == 'snowflake' ? 'SALES' : 'sales',
            },
            {
              name: 'filter',
              condition: {
                column: TRANSLATOR == 'snowflake' ? 'PRICE' : 'Price',
                operator: 'ge',
                value: 1200,
              },
            },
          ],
          pipelineAmex: [
            {
              name: 'domain',
              domain: TRANSLATOR == 'snowflake' ? 'SALES' : 'sales',
            },
            {
              name: 'filter',
              condition: {
                column: TRANSLATOR == 'snowflake' ? 'PAYMENT_TYPE' : 'Payment_Type',
                operator: 'eq',
                value: 'Amex',
              },
            },
          ],
          pipelineVisa: [
            {
              name: 'domain',
              domain: TRANSLATOR == 'snowflake' ? 'SALES' : 'sales',
            },
            {
              name: 'filter',
              condition: {
                column: TRANSLATOR == 'snowflake' ? 'PAYMENT_TYPE' : 'Payment_Type',
                operator: 'eq',
                value: 'Visa',
              },
            },
          ],
          pipelineMastercard: [
            {
              name: 'domain',
              domain: TRANSLATOR == 'snowflake' ? 'SALES' : 'sales',
            },
            {
              name: 'filter',
              condition: {
                column: TRANSLATOR == 'snowflake' ? 'PAYMENT_TYPE' : 'Payment_Type',
                operator: 'eq',
                value: 'Mastercard',
              },
            },
          ],
          dates: [
            {
              name: 'domain',
              domain: TRANSLATOR == 'snowflake' ? 'SIN_FROM_2019_TO_2022' : 'sin-from-2019-to-2022',
            },
            {
              name: 'filter',
              condition: {
                column: TRANSLATOR == 'snowflake' ? 'DAY' :'day',
                operator: 'from',
                value: new Date('2021-11-19T00:00:00Z'),
              },
            },
          ],
        },
        currentDomain: TRANSLATOR == 'snowflake' ? 'SALES' :'sales',
        translator: TRANSLATOR,
        backendService: backendService,
        // based on lodash templates (ERB syntax)
        interpolateFunc: (value, context) => exampleInterpolateFunc(value, context),
        variables: VARIABLES,

        featureFlags: {
          RELATIVE_DATE_FILTERING: args.get('RELATIVE_DATE_FILTERING') || 'disable'
        }
      });
      // Add variables
      store.commit(VQBnamespace('setAvailableVariables'), {
        availableVariables: AVAILABLE_VARIABLES,
      });
      store.commit(VQBnamespace('setVariableDelimiters'), {
        variableDelimiters: { start: '<%=', end: '%>' },
      });
      const collections = await backendService.listCollections();
      store.commit(VQBnamespace('setDomains'), { domains: collections });
      store.dispatch(VQBnamespace('updateDataset'));
    },
    computed: {
      activePipeline: function() {
        let activePipeline = this.$store.getters[VQBnamespace('activePipeline')];
        if (!activePipeline) {
          return undefined;
        }
        const pipelines = this.$store.getters[VQBnamespace('pipelines')];
        if (pipelines) {
          return dereferencePipelines(activePipeline, pipelines);
        } else {
          return activePipeline;
        }
      },
      pipelineAsJSON: function() {
        return JSON.stringify(this.activePipeline, null, 2);
      },
      thereIsABackendError: function() {
        return this.$store.getters[VQBnamespace('thereIsABackendError')];
      },
      backendMessages: function() {
        return this.$store.state[VQB_MODULE_NAME].backendMessages;
      },
      backendErrors: function() {
        return this.backendMessages.filter(({ type }) => type === 'error');
      },
      backendWarnings: function() {
        return this.backendMessages.filter(({ type }) => type === 'warning');
      },
    },
    methods: {
      hideCode: function() {
        this.isCodeOpened = false;
      },
      openCode: function() {
        this.isCodeOpened = true;
      },
      isSelectedTranslator: function(translator) {
        return TRANSLATOR === translator
      },
    },
  });

  updateLastExecutedQuery = (query) => {
    if (query == null || typeof query === 'string') {
      vm.lastExecutedQuery = query;
    } else {
      vm.lastExecutedQuery = JSON.stringify(query, null, 2);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => buildVueApp());
