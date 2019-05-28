import { BaseTranslator } from '@/lib/translators/base';
import {
    Pipeline,
    SelectStep
} from '@/lib/steps';
import { StepMatcher } from '@/lib/matcher';


export interface SQLStep {
    [propName: string] : any;
}

function transformSelect(step : SelectStep): SQLStep[] {

}

const mapper: StepMatcher<SQLStep> = {
    select: transformSelect
};

export class SQLTranslator extends BaseTranslator {
    translate(pipeline : Pipeline) {

    }
}

Object.assign(SQLTranslator.prototype, mapper);
