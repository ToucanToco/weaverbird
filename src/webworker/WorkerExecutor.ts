import DataWorker from 'web-worker:./main-worker.ts';
import {Pipeline} from "@/lib/steps";

export class WorkerExecutor {
  webWorker: DataWorker

  constructor() {
    this.webWorker = new DataWorker();
    this.webWorker.onmessage = this.onmessage
  }

  onmessage(arg: any) {
    console.log(arg);
  }

 async execute_pipeline(pipeline: Pipeline, data: Array<{string:any}>): any {
    this.webWorker.postMessage([pipeline, data]);
  }

}
