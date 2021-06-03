// export lib entrypoints
import {execute_pipeline} from "@/lib/front-engine";
import {Pipeline} from "@/lib/steps";


self.addEventListener('message', e => {
  let data = e.data[0].data
  let pipeline: Pipeline = e.data[1].slice(1)


  const result = execute_pipeline(pipeline, data)
  postMessage(result);
});
