import { PiniaVuePlugin, createPinia } from "pinia";
import Vue from "vue";

import Playground from './Playground.vue';

const pinia = createPinia();
Vue.use(PiniaVuePlugin);

async function buildVueApp() {
  new Vue({
    el: '#app',
    components: {
      Playground,
    },
    // @ts-ignore
    pinia,
    render: (h) => h(Playground, { attrs: { id: 'app' } }),
  });
}

document.addEventListener('DOMContentLoaded', () => buildVueApp());
