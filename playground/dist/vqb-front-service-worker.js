importScripts(['/weaverbird-worker.browser.js']);
const {
  aggregate
} = vqb;

var onmessage = function(e) {
  const data = e.data.data;
  const pipeline = e.data.pipeline;
  postMessage('executing pipeline');
  aggregate();
}
