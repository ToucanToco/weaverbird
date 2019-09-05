import Vuex from 'vuex';
import { registerModule } from '@/store';

export function setupMockStore(initialState: object = {}, plugins: any[] = []) {
  const store = new Vuex.Store({ plugins });
  registerModule(store, initialState);

  return store;
}
