import Vue from "vue";
import Vuex from "vuex";

import Playground from './Playground.vue';

Vue.use(Vuex);
const store = new Vuex.Store({});

async function buildVueApp() {
  const store = new Vuex.Store({});

  new Vue({
    el: '#app',
    components: {
      Playground,
    },
    store,
    render: (h) => h(Playground, { attrs: { id: 'app' } }),
  });
}

document.addEventListener('DOMContentLoaded', () => buildVueApp());
