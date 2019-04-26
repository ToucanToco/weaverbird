import { PipelineStep } from '@/lib/steps';

export const mongodb = {
  url: 'mongodb://localhost:27018',
  dbname: 'api-sandbox-new-laputa-new',
};

export const pipeline: Array<PipelineStep> = [
  { name: 'domain', domain: 'reports' },
  { name: 'filter', column: 'entityName', value: 'Troll face', operator: 'eq' },
  { name: 'filter', column: 'id', value: 'yolo', operator: 'eq' },
];
