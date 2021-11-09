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
  exampleInterpolateFunc,
} = vqb;

const args = new URLSearchParams(location.search);

const TRANSLATOR = args.get('backend') || 'mongo42';

const mongoTranslator = getTranslator('mongo42');
const pandasTranslator = getTranslator('pandas');

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
    const query = mongoTranslator.translate(subpipeline);
    const { isResponseOk, responseContent } = await this.executeQuery(query, domain, limit, offset);

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

  async executeQuery(query, collection, limit, skip) {
    const response = await fetch('/mongo', {
      method: 'POST',
      body: JSON.stringify({
        query,
        collection,
        limit,
        skip,
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

  async loadCSV(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/load', {
      method: 'POST',
      body: formData,
    });
    return response.json();
  }
}

const mongoService = new MongoService();

class PandasService {
  async listCollections() {
    const response = await fetch('/pandas');
    return response.json();
  }

  async executePipeline(pipeline, pipelines, limit, offset = 0) {
    const dereferencedPipeline = dereferencePipelines(pipeline, pipelines);

    // This does not modify the pipeline, but checks if all steps are supported
    pandasTranslator.translate(dereferencedPipeline);

    const url = new URL(window.location.origin + '/pandas');
    url.searchParams.set('limit', limit);
    url.searchParams.set('offset', offset);

    const response = await fetch(url.toString(), {
      method: 'POST',
      body: JSON.stringify(dereferencedPipeline),
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
      return { data: dataset };
    } else {
      return {
        error: [{ type: 'error', message: result }],
      };
    }
  }
}
const pandasService = new PandasService();

const backendService = TRANSLATOR === 'pandas' ? pandasService : mongoService


async function buildVueApp() {
  const AVAILABLE_VARIABLES = [
    {
      category: 'App variables',
      label: 'view',
      identifier: 'view',
      value: 'Product 123',
    },
    {
      category: 'App variables',
      label: 'date.month',
      identifier: 'date.month',
      value: 'Apr',
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
  const VARIABLES = {
    view: 'Product 123',
    date: {
      year: 2020,
      month: 'Apr',
    },
    city: 'New York',
    country: 'New Zealand',

    value1: 2,
    value2: 13,
    groupname: 'Group 1',
  }

  Vue.use(Vuex);
  const store = new Vuex.Store({});

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
    created: async function() {
      registerModule(this.$store, {
        currentPipelineName: 'pipeline',
        pipelines: {
          pipeline: [
            {
              name: 'domain',
              domain: 'sales',
            },
            {
              name: 'filter',
              condition: {
                column: 'Price',
                operator: 'ge',
                value: 1200,
              },
            },
          ],
          pipelineAmex: [
            {
              name: 'domain',
              domain: 'sales',
            },
            {
              name: 'filter',
              condition: {
                column: 'Payment_Type',
                operator: 'eq',
                value: 'Amex',
              },
            },
          ],
          pipelineVisa: [
            {
              name: 'domain',
              domain: 'sales',
            },
            {
              name: 'filter',
              condition: {
                column: 'Payment_Type',
                operator: 'eq',
                value: 'Visa',
              },
            },
          ],
          pipelineMastercard: [
            {
              name: 'domain',
              domain: 'sales',
            },
            {
              name: 'filter',
              condition: {
                column: 'Payment_Type',
                operator: 'eq',
                value: 'Mastercard',
              },
            },
          ],
        },
        currentDomain: 'sales',
        translator: TRANSLATOR,
        backendService: backendService,
        // based on lodash templates (ERB syntax)
        interpolateFunc: (value, context) => exampleInterpolateFunc(value, context),
        variables: VARIABLES,
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
      mongoQueryAsJSON: function() {
        const query = mongoTranslator.translate(this.activePipeline);
        return JSON.stringify(query, null, 2);
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
        const { collection: domain } = await mongoService.loadCSV(event.dataTransfer.files[0]);
        await setupInitialData(store, domain);
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
