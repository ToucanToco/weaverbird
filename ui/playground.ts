// For now, this is very similar to playground/dist/app.js
// TODO: factor common code

import Vue from "vue/dist/vue.js"; // need the template compiler
import Vuex from "vuex";

import {
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
} from './src/main';

Vue.use(Vuex);

const args = new URLSearchParams(location.search);

const TRANSLATOR = args.get('backend') || 'mongo50';

const USE_MONGO_BACKEND_TRANSLATOR = args.get('mongo-python') === 'enable';
const API_BASEROUTE = args.get('api') || 'http://localhost:5000';

const mongoTranslator = getTranslator('mongo50');
const pandasTranslator = getTranslator('pandas');
const snowflakeTranslator = getTranslator('snowflake');
const athenaTranslator = getTranslator('athena');
const googleBigQueryTranslator = getTranslator('google-big-query');
const mysqlTranslator = getTranslator('mysql');
const postgresqlTranslator = getTranslator('postgresql');
const redshiftTranslator = getTranslator('redshift');

const VARIABLES = {
  view: 'Product 123',
  angeBirthday: new Date('2021-08-08'),
  now: new Date(Date.now()),
  city: 'New York',
  country: 'New Zealand',

  value1: 2,
  value2: 13,
  groupname: 'Group 1',
};

const AVAILABLE_VARIABLES = [
  {
    category: 'App variables',
    label: 'view',
    identifier: 'view',
    value: 'Product 123',
  },
  {
    category: 'Dates',
    label: "Ange's birthday",
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
const sendAnalytics = ({ name, value }) => {
  console.debug('Analytics event send ::', { name, value });
};
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
    const response = await fetch(API_BASEROUTE + '/mongo');
    return response.json();
  }

  async executePipeline(pipeline, pipelines, limit, offset = 0) {
    const dereferencedPipeline = dereferencePipelines(pipeline, pipelines);

    let isResponseOk, responseContent, query;

    if (USE_MONGO_BACKEND_TRANSLATOR) {
      const dereferencedPipelineWithoutVariables = exampleInterpolateFunc(
        dereferencedPipeline,
        VARIABLES,
      );

      // FIXME it would be better if the mongo translator returned a tuple (collection, query)
      const { domain: collection, pipeline: subpipeline } = filterOutDomain(
        dereferencedPipelineWithoutVariables,
      );

      const response = await fetch(API_BASEROUTE + '/mongo', {
        method: 'POST',
        body: JSON.stringify({
          limit: limit,
          offset: offset,
          collection: collection,
          pipeline: subpipeline,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      isResponseOk = response.ok;
      responseContent = await response.json();
      query = responseContent.query;
    } else {
      const { domain, pipeline: subpipeline } = filterOutDomain(dereferencedPipeline);
      const queryWithVariables = mongoTranslator.translate(subpipeline);
      query = exampleInterpolateFunc(queryWithVariables, VARIABLES);
      ({ isResponseOk, responseContent } = await this.executeQuery(query, domain, limit, offset));
      responseContent = responseContent[0];
      responseContent.total = responseContent.count;
    }

    if (isResponseOk) {
      const { total, data: rset, types } = responseContent;
      updateLastExecutedQuery(query);
      let dataset = mongoResultsToDataset(rset);
      dataset.paginationContext = {
        totalCount: total,
        pagesize: limit,
        pageno: Math.floor(offset / limit) + 1,
      };
      if (types && types.length) {
        dataset = annotateDataset(dataset, types[0]);
        dataset = autocastDataset(dataset);
      }
      return { data: dataset, translator: 'mongo50' };
    } else {
      return {
        error: [{ type: 'error', message: responseContent.errmsg }],
      };
    }
  }

  async executeQuery(query, collection, limit, offset) {
    const response = await fetch(API_BASEROUTE + '/mongo-translated', {
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
    const response = await fetch(API_BASEROUTE + '/pandas');
    return response.json();
  }

  async executePipeline(pipeline, pipelines, limit, offset = 0) {
    const dereferencedPipeline = dereferencePipelines(pipeline, pipelines);

    // This does not modify the pipeline, but checks if all steps are supported
    pandasTranslator.translate(dereferencedPipeline);

    const dereferencedPipelineWithoutVariables = exampleInterpolateFunc(
      dereferencedPipeline,
      VARIABLES,
    );

    const url = new URL(API_BASEROUTE + '/pandas');
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
        offset: offset,
      },
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
      return { data: dataset, translator: 'pandas' };
    } else {
      let error = { type: 'error' };
      if (typeof result === 'string') {
        error.message = result;
      } else {
        error = { ...result, ...error };
      }
      return {
        error: [error],
      };
    }
  }
}

class SnowflakeService {
  async listCollections() {
    const response = await fetch(API_BASEROUTE + '/snowflake');
    return response.json();
  }

  async executePipeline(pipeline, pipelines, limit, offset = 0) {
    const dereferencedPipeline = dereferencePipelines(pipeline, pipelines);

    // This does not modify the pipeline, but checks if all steps are supported
    snowflakeTranslator.translate(dereferencedPipeline);
    const dereferencedPipelineWithoutVariables = exampleInterpolateFunc(
      dereferencedPipeline,
      VARIABLES,
    );

    const url = new URL(API_BASEROUTE + '/snowflake');
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
        offset: offset,
      },
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
      return { data: dataset, translator: 'snowflake' };
    } else {
      updateLastExecutedQuery(null);
      return {
        error: [{ type: 'error', message: result }],
      };
    }
  }
}

class AthenaService {
  async listCollections() {
    const response = await fetch(API_BASEROUTE + '/athena');
    return response.json();
  }

  async executePipeline(pipeline, pipelines, limit, offset = 0) {
    const dereferencedPipeline = dereferencePipelines(pipeline, pipelines);

    // This does not modify the pipeline, but checks if all steps are supported
    athenaTranslator.translate(dereferencedPipeline);
    const dereferencedPipelineWithoutVariables = exampleInterpolateFunc(
      dereferencedPipeline,
      VARIABLES,
    );

    const url = new URL(API_BASEROUTE + '/athena');
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
        offset: offset,
      },
    });
    const result = await response.json();

    if (response.ok) {
      let dataset = pandasDataTableToDataset(result.results);
      dataset.paginationContext = {
        totalCount: result.total,
        pagesize: limit,
        pageno: Math.floor(offset / limit) + 1,
      };
      dataset = autocastDataset(dataset);
      updateLastExecutedQuery(result.query);
      return { data: dataset, translator: 'athena' };
    } else {
      updateLastExecutedQuery(null);
      return {
        error: [{ type: 'error', message: result }],
      };
    }
  }
}

class GoogleBigQueryService {
  async listCollections() {
    const response = await fetch(API_BASEROUTE + '/google-big-query');
    return response.json();
  }

  async executePipeline(pipeline, pipelines, limit, offset = 0) {
    const dereferencedPipeline = dereferencePipelines(pipeline, pipelines);

    // This does not modify the pipeline, but checks if all steps are supported
    googleBigQueryTranslator.translate(dereferencedPipeline);
    const dereferencedPipelineWithoutVariables = exampleInterpolateFunc(
      dereferencedPipeline,
      VARIABLES,
    );

    const url = new URL(window.location.origin + '/google-big-query');
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
        offset: offset,
      },
    });
    const result = await response.json();

    if (response.ok) {
      let dataset = pandasDataTableToDataset(result.results);
      dataset.paginationContext = {
        totalCount: result.total,
        pagesize: limit,
        pageno: Math.floor(offset / limit) + 1,
      };
      dataset = autocastDataset(dataset);
      updateLastExecutedQuery(result.query);
      return { data: dataset, translator: 'google-big-query' };
    } else {
      updateLastExecutedQuery(null);
      return {
        error: [{ type: 'error', message: result }],
      };
    }
  }
}

class MySqlService {
  async listCollections() {
    const response = await fetch(API_BASEROUTE + '/mysql');
    return response.json();
  }

  async executePipeline(pipeline, pipelines, limit, offset = 0) {
    const dereferencedPipeline = dereferencePipelines(pipeline, pipelines);

    // This does not modify the pipeline, but checks if all steps are supported
    mysqlTranslator.translate(dereferencedPipeline);
    const dereferencedPipelineWithoutVariables = exampleInterpolateFunc(
      dereferencedPipeline,
      VARIABLES,
    );

    const url = new URL(API_BASEROUTE + '/mysql');
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
        offset: offset,
      },
    });
    const result = await response.json();

    if (response.ok) {
      let dataset = pandasDataTableToDataset(result.results);
      dataset.paginationContext = {
        totalCount: result.total,
        pagesize: limit,
        pageno: Math.floor(offset / limit) + 1,
      };
      dataset = autocastDataset(dataset);
      updateLastExecutedQuery(result.query);
      return { data: dataset, translator: 'mysql' };
    } else {
      updateLastExecutedQuery(null);
      return {
        error: [{ type: 'error', message: result }],
      };
    }
  }
}

class PostgresqlService {
  async listCollections() {
    const response = await fetch(API_BASEROUTE + '/postgresql');
    return response.json();
  }

  async executePipeline(pipeline, pipelines, limit, offset = 0) {
    const dereferencedPipeline = dereferencePipelines(pipeline, pipelines);

    // This does not modify the pipeline, but checks if all steps are supported
    postgresqlTranslator.translate(dereferencedPipeline);
    const dereferencedPipelineWithoutVariables = exampleInterpolateFunc(
      dereferencedPipeline,
      VARIABLES,
    );

    const url = new URL(API_BASEROUTE + '/postgresql');
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
        offset: offset,
      },
    });
    const result = await response.json();

    if (response.ok) {
      let dataset = result.results;
      dataset.paginationContext = {
        totalCount: result.total,
        pagesize: limit,
        pageno: Math.floor(offset / limit) + 1,
      };
      // dataset = autocastDataset(dataset);
      updateLastExecutedQuery(result.query);
      return { data: dataset, translator: 'postgresql' };
    } else {
      updateLastExecutedQuery(null);
      return {
        error: [{ type: 'error', message: result }],
      };
    }
  }
}

class RedshiftService {
  async listCollections() {
    const response = await fetch(API_BASEROUTE + '/redshift');
    return response.json();
  }

  async executePipeline(pipeline, pipelines, limit, offset = 0) {
    const dereferencedPipeline = dereferencePipelines(pipeline, pipelines);

    // This does not modify the pipeline, but checks if all steps are supported
    redshiftTranslator.translate(dereferencedPipeline);
    const dereferencedPipelineWithoutVariables = exampleInterpolateFunc(
      dereferencedPipeline,
      VARIABLES,
    );

    const url = new URL(API_BASEROUTE + '/redshift');
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
        offset: offset,
      },
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
      return { data: dataset, translator: 'redshift' };
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
  case 'athena':
    backendService = new AthenaService();
    break;
  case 'google-big-query':
    backendService = new GoogleBigQueryService();
    break;
  case 'mysql':
    backendService = new MySqlService();
    break;
  case 'postgresql':
    backendService = new PostgresqlService();
    break;
  case 'redshift':
    backendService = new RedshiftService();
    break;
  default:
    backendService = new MongoService();
}

let updateLastExecutedQuery = function() {};
async function buildVueApp() {
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
      const registrationOpts = {
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
            {
              name: 'top',
              groups: [],
              rank_on: 'Transaction_date',
              sort: 'asc',
              limit: 100,
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
                column: TRANSLATOR == 'snowflake' ? 'DAY' : 'day',
                operator: 'from',
                value: new Date('2021-11-19T00:00:00Z'),
              },
            },
          ],
        },
        translator: TRANSLATOR,
        backendService: backendService,
        // based on lodash templates (ERB syntax)
        interpolateFunc: (value, context) => exampleInterpolateFunc(value, context),
        variables: VARIABLES,

        featureFlags: {
          RELATIVE_DATE_FILTERING: (args.get('RELATIVE_DATE_FILTERING') as 'enable' | 'disable') || 'disable',
        },
      };
      if (TRANSLATOR === 'pandas') {
        registrationOpts.pipelines.pipelineDepartements = [
          {
            domain: 'departements-france',
            name: 'domain',
          },
          {
            name: 'join',
            right_pipeline: 'departements-regions-france',
            type: 'left',
            on: [['dep', 'code_departement']],
          },
          {
            name: 'text',
            new_column: 'whitespace',
            text: ' ',
          },
          {
            name: 'concatenate',
            columns: ['nom_departement', 'whitespace'],
            separator: ',',
            new_column_name: 'departement_nom',
          },
          {
            name: 'select',
            columns: [
              'code_departement',
              'departement_nom',
              'code_region',
              'nom_region',
              'geometry',
            ],
          },
          {
            name: 'dissolve',
            groups: ['code_region'],
            include_nulls: false,
            aggregations: [
              {
                columns: ['departement_nom'],
                newcolumns: ['departement_nom'],
                aggfunction: 'sum',
              },
              {
                columns: ['nom_region'],
                newcolumns: ['nom_region'],
                aggfunction: 'first',
              },
            ],
          },
        ];
      } else if (TRANSLATOR === 'athena' || TRANSLATOR === 'google-big-query') {
        registrationOpts.currentPipelineName = 'beersPipeline';
        registrationOpts.pipelines = {
          beersPipeline: [
            {
              domain: TRANSLATOR === 'athena' ? 'beers' : 'biquery-integration-tests.beers.beers',
              name: 'domain',
            },
            {
              name: 'filter',
              condition: {
                and: [
                  {
                    column: 'beer_kind',
                    value: 'Blonde',
                    operator: 'eq',
                  },
                  {
                    column: 'nullable_name',
                    value: null,
                    operator: 'notnull',
                  },
                ],
              },
            },
            {
              name: 'top',
              rank_on: 'alcohol_degree',
              sort: 'desc',
              limit: 20,
            },
          ],
        };
      }
      registerModule(this.$store, registrationOpts);

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
        return this.backendMessages.filter(({ type, index }) => type === 'error' && index == null);
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
        return TRANSLATOR === translator;
      },
    },
  });

  updateLastExecutedQuery = query => {
    if (query == null || typeof query === 'string') {
      vm.lastExecutedQuery = query;
    } else {
      vm.lastExecutedQuery = JSON.stringify(query, null, 2);
    }
  };
}

document.addEventListener('DOMContentLoaded', () => buildVueApp());
