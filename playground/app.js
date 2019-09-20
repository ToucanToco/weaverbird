/* eslint-disable @typescript-eslint/no-var-requires */
const {
  Vqb,
  VQBnamespace,
  VQB_MODULE_NAME,
  filterOutDomain,
  inferTypeFromDataset,
  getTranslator,
  mongoResultsToDataset,
  servicePluginFactory,
  registerModule,
} = vqb;

const mongo36translator = getTranslator('mongo36');

class MongoService {
  async listCollections(_store) {
    const response = await fetch('/collections');
    return response.json();
  }

  async executePipeline(_store, pipeline, limit, offset = 0) {
    const { domain, pipeline: subpipeline } = filterOutDomain(pipeline);
    const query = mongo36translator.translate(subpipeline);
    const { isResponseOk, responseContent } = await this.executeQuery(query, domain, limit, offset);

    if (isResponseOk) {
      const [{ count, data: rset }] = responseContent;
      const dataset = mongoResultsToDataset(rset);
      dataset.paginationContext = {
        totalCount: count,
        pagesize: limit,
        pageno: Math.floor(offset / limit) + 1,
      };
      const datasetWithInferedType = inferTypeFromDataset(dataset);
      return {
        data: datasetWithInferedType,
      };
    } else {
      return {
        error: responseContent.errmsg,
      };
    }
  }

  async executeQuery(query, collection, limit, skip) {
    const response = await fetch('/query', {
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

const mongoservice = new MongoService();
const mongoBackendPlugin = servicePluginFactory(mongoservice);
const initialPipeline = [
  {
    name: 'domain',
    domain: 'test-collection',
  },
];

async function setupInitialData(store, domain = null) {
  const collections = await mongoservice.listCollections();
  store.commit(VQBnamespace('setDomains'), {
    domains: collections,
  });
  if (domain !== null) {
    store.commit(VQBnamespace('setCurrentDomain'), {
      currentDomain: domain,
    });
  } else {
    const response = await mongoservice.executePipeline(
      store,
      store.state[VQB_MODULE_NAME].pipeline,
      store.state[VQB_MODULE_NAME].pagesize,
    );
    if (response.error) {
      store.commit(VQBnamespace('setBackendError'), {
        backendError: { type: 'error', error: response.error },
      });
    } else {
      store.commit(VQBnamespace('setDataset'), { dataset: response.data });
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
      registerModule(this.$store, { pipeline: initialPipeline, currentDomain: 'test-collection' });
      setupInitialData(this.$store);
    },
    computed: {
      code: function() {
        const query = mongo36translator.translate(
          this.$store.getters[VQBnamespace('activePipeline')],
        );
        return JSON.stringify(query, null, 2);
      },
      thereIsABackendError: function() {
        return this.$store.getters[VQBnamespace('thereIsABackendError')];
      },
      backendErrorMessage: function() {
        return this.$store.getters[VQBnamespace('backendErrorMessage')];
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
