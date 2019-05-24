<template>
  <div id="app">
    <ResizablePanels>
      <FormRenameStep
        v-if="isEditingStep"
        :initialValue="initialValue"
        slot="left-panel"
        @cancel="toggleStepEdition()"
        @formSaved="saveStep"
      />
      <Pipeline v-else slot="left-panel"/>
      <DataViewer slot="right-panel" @stepCreated="openStepForm"/>
    </ResizablePanels>
    <pre><code>{{ code }}</code></pre>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { Getter, Mutation, State } from 'vuex-class';
import { VQBState, activePipeline } from '@/store/state';
import { Pipeline, PipelineStep } from '@/lib/steps';
import { DataSet } from '@/lib/dataset';
import { MongoResults, mongoResultsToDataset } from '@/lib/dataset/mongo';
import {
  DataViewer,
  FormRenameStep,
  Pipeline as PipelineComponent,
  ResizablePanels,
  getTranslator,
} from '../dist/vue-query-builder.common.js';
import _ from 'lodash';

const mongo36translator = getTranslator('mongo36');

@Component({
  components: {
    DataViewer,
    FormRenameStep,
    Pipeline: PipelineComponent,
    ResizablePanels,
  },
})
export default class App extends Vue {
  @State pipeline!: Pipeline;
  @State domains!: Array<string>;
  @State isEditingStep!: boolean;

  @Getter activePipeline!: Pipeline;

  @Mutation setDomains!: (payload: Pick<VQBState, 'domains'>) => void;
  @Mutation setPipeline!: (payload: Pick<VQBState, 'pipeline'>) => void;
  @Mutation setDataset!: (payload: Pick<VQBState, 'dataset'>) => void;
  @Mutation toggleStepEdition!: () => void;

  initialValue: any = undefined;

  get code() {
    const query = mongo36translator.translate(this.activePipeline);
    return JSON.stringify(query, null, 2);
  }

  async mounted() {
    const response = await fetch('/collections');
    const collections = await response.json();
    this.setDomains({ domains: collections });
    await this.updateData(this.pipeline);
  }

  // cancelStepEdition() {
  //   this.isEditingStep = false;
  // }

  openStepForm(params: any) {
    // params.name will be used to choose the right form
    // after that, we delete from params to pass down the others keys to initialValue
    this.initialValue = _.omit(params, 'name');
    // this.isEditingStep = true;
    this.toggleStepEdition();
  }

  saveStep(step: PipelineStep) {
    // Reset value from DataViewer
    this.initialValue = undefined;
    this.updateData([...this.pipeline, step]);
    this.toggleStepEdition();
  }

  async updateData(pipeline: Pipeline) {
    this.setPipeline({ pipeline });
    if (!pipeline.length || pipeline[0].name !== 'domain') {
      throw new Error('first step should be a domain step to specify the collection');
    }
    const [domainStep, ...subpipeline] = pipeline;
    const query = mongo36translator.translate(subpipeline);
    const response = await fetch('/query', {
      method: 'POST',
      body: JSON.stringify({ query, collection: domainStep.domain }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const mongorset = await response.json();
    this.setDataset({ dataset: mongoResultsToDataset(mongorset as MongoResults) });
  }
}
</script>
