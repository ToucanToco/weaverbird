/* eslint-disable @typescript-eslint/no-var-requires */
const {
  Vqb,
  filterOutDomain,
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

  async executePipeline(pipeline) {
    const { domain, pipeline: subpipeline } = filterOutDomain(pipeline);
    debugger;
    const rset = await this.executeQuery(this.translator.translate(subpipeline), domain);
    return mongoResultsToDataset(rset);
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
  {
    name: 'filter',
    column: 'Value4',
    value: 1,
    operator: 'gt',
  },
  {
    name: 'replace',
    search_column: 'Value2',
    to_replace: [[2, 20], [13, 24]],
  },
  {
    name: 'top',
    rank_on: 'Value2',
    sort: 'asc',
    limit: 3,
  },
  {
    name: 'pivot',
    index: ['Groups'],
    column_to_pivot: 'Label',
    value_column: 'Value2',
    agg_function: 'sum',
  },
];

async function buildVueApp() {
  Vue.use(Vuex);
  const store = setupStore(
    {
      pipeline: initialPipeline,
      currentDomain: 'test-collection',
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
      drop: function(event) {
        this.draggedover = false;
        event.preventDefault();

        // For the moment, only take one file and we should also test event.target
        mongoservice.loadCSV(event.dataTransfer.files[0]);
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
  const collections = await mongoservice.listCollections();
  store.commit('setDomains', {
    domains: collections,
  });
  const dataset = await mongoservice.executePipeline(initialPipeline);
  store.commit('setDataset', {
    dataset,
  });
}

document.addEventListener('DOMContentLoaded', () => buildVueApp());
