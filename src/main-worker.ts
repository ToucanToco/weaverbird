// export lib entrypoints
import {aggregate} from "@/lib/front-engine";

export { filterOutDomain, mongoToPipe } from './lib/pipeline';
export {aggregate} from './lib/front-engine'


self.addEventListener('message', e => {
    console.log(e);
    aggregate();
    postMessage('executing pipeline', "origin");
});
