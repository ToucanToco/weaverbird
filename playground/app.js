/* eslint-disable @typescript-eslint/no-var-requires */
const {
  Vqb,
  filterOutDomain,
  inferTypeFromDataset,
  getTranslator,
  mongoResultsToDataset,
  servicePluginFactory,
  setupStore,
} = vqb;

const mongo36translator = getTranslator('mongo36');

class MongoService {
  constructor() {
    this.translator = getTranslator('mongo36');
  }

  async listCollections() {
    const response = await fetch('/collections');
    return response.json();
  }

  async executePipeline(pipeline, limit, offset = 0) {
    const { domain, pipeline: subpipeline } = filterOutDomain(pipeline);
    const query = this.translator.translate(subpipeline);
    // first offset
    if (offset) {
      query.push({ $skip: offset });
    }
    // then limit
    if (limit) {
      query.push({ $limit: limit });
    }
    const [{ count, data: rset }] = await this.executeQuery(query, domain);
    const dataset = mongoResultsToDataset(rset);
    dataset.paginationContext = {
      totalCount: count,
      pagesize: limit,
      pageno: Math.floor(offset / limit),
    }
    const datasetWithInferedType = inferTypeFromDataset(dataset);
    return datasetWithInferedType;
  }

  async executeQuery(query, collection) {
    const response = await fetch('/query', {
      method: 'POST',
      body: JSON.stringify({
        query,
        collection,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.json();
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
  store.commit('setDomains', {
    domains: collections,
  });
  if (domain !== null) {
    store.commit('setCurrentDomain', {
      currentDomain: domain,
    });
  } else {
    const dataset = await mongoservice.executePipeline(store.state.pipeline, store.state.pagesize);
    store.commit('setDataset', { dataset });
  }
}

async function buildVueApp() {
  Vue.use(Vuex);
  const store = setupStore(
    {
      pipeline: initialPipeline,
      currentDomain: 'test-collection',
      pagesize: 2,
    },
    [mongoBackendPlugin],
  );

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
    computed: {
      code: function() {
        const query = mongo36translator.translate(this.$store.getters.activePipeline);
        return JSON.stringify(query, null, 2);
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
  setupInitialData(store);
}

document.addEventListener('DOMContentLoaded', () => buildVueApp());
