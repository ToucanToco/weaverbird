<template>
  <div class="ifthenelse-widget">
    <div class="ifthenelse-container">
      <div class="ifthenelse-widget__if">{{ isRoot ? 'IF' : 'ELSE IF' }}</div>
      <FilterEditor
        :filter-tree="value.if"
        :errors="errors"
        :data-path="`${dataPath}.if`"
        @filterTreeUpdated="updateFilterTree"
      />
      <div class="ifthenelse-widget__then">THEN</div>
      <InputTextWidget
        class="formulaInput"
        :value="value.then"
        @input="updateThenFormula"
        placeholder='Enter a "Text" with quotes, or a formula'
        :data-path="`${dataPath}.then`"
        :errors="errors"
      />
      <div v-if="elseMode === 'ELSE:'" class="ifthenelse-widget__else">ELSE</div>
      <AutocompleteWidget
        class="ifthenelse-widget__else"
        v-model="elseMode"
        @input="updateElseMode"
        :options="elseModes"
      />
      <InputTextWidget
        v-if="elseMode === 'ELSE:'"
        class="formulaInput"
        :value="value.else"
        @input="updateElseFormula"
        placeholder='Enter a "Text" with quotes, or a formula'
        :data-path="`${dataPath}.else`"
        :errors="errors"
      />
    </div>
    <ifthenelse-widget
      v-if="elseMode === 'ELSE IF:'"
      :value="value.else"
      @input="updateElseObject"
      :data-path="`${dataPath}.else`"
      :errors="errors"
    />
  </div>
</template>

<script lang="ts">
import { ErrorObject } from 'ajv';
import { Component, Prop, Vue } from 'vue-property-decorator';

import FilterEditor from '@/components/FilterEditor.vue';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { ColumnTypeMapping } from '@/lib/dataset';
import { FilterCondition, IfThenElseStep } from '@/lib/steps';
import { VQBModule } from '@/store';

@Component({
  name: 'ifthenelse-widget',
  components: {
    AutocompleteWidget,
    FilterEditor,
    InputTextWidget,
  },
})
export default class IfThenElseWidget extends Vue {
  @Prop({
    type: Object,
    default: () => ({
      if: { column: '', value: '', operator: 'eq' },
      then: '',
      else: '',
    }),
  })
  value!: Omit<IfThenElseStep, 'name' | 'newColumn'>;

  @Prop({ type: String, default: '' })
  dataPath!: string;

  @Prop({
    type: Boolean,
    default: false,
  })
  isRoot!: boolean;

  @Prop({
    type: Array,
    default: () => [],
  })
  errors!: ErrorObject[];

  @VQBModule.Getter columnTypes!: ColumnTypeMapping;

  readonly title: string = 'Add a conditional column';
  readonly elseModes = ['ELSE:', 'ELSE IF:'];
  elseMode = typeof this.value.else === 'string' ? 'ELSE:' : 'ELSE IF:';

  updateFilterTree(newFilterTree: FilterCondition) {
    this.$emit('input', {
      ...this.value,
      if: newFilterTree,
    });
  }

  updateThenFormula(formula: string) {
    this.$emit('input', {
      ...this.value,
      then: formula,
    });
  }

  updateElseFormula(formula: string) {
    this.$emit('input', {
      ...this.value,
      else: formula,
    });
  }

  updateElseMode(elseMode: string) {
    if (elseMode === 'ELSE:') {
      this.$emit('input', {
        ...this.value,
        else: '',
      });
    } else {
      this.$emit('input', {
        ...this.value,
        else: {
          if: { column: '', value: '', operator: 'eq' },
          then: '',
          else: '',
        },
      });
    }
  }

  updateElseObject(elseObject: Omit<IfThenElseStep, 'name' | 'newColumn'>) {
    this.$emit('input', {
      ...this.value,
      else: elseObject,
    });
  }
}
</script>

<style lang="scss" scoped>
.filter-form-headers__container {
  display: flex;
  width: 66%;
}

.filter-form-header {
  font-size: 14px;
  margin-left: 10px;
  width: 50%;
}
</style>
<style lang="scss">
@import '../../../styles/_variables';

.filter-form {
  .widget-list__body .widget-list__icon {
    top: 5px;
  }
  .widget-list__component-sep {
    left: 0;
    position: absolute;
    top: 10px;
  }
}

.filter-form--multiple-conditions {
  .filter-form-headers__container {
    margin-left: 30px;
  }
  .widget-list__component {
    margin-left: 30px;
  }
}

.formulaInput {
  @extend %form-widget__container;
  margin-top: 10px;
  margin-bottom: 0px;
}

.ifthenelse-container {
  border-left: 3px solid $active-color-faded;
  padding: 5px 0px 5px 10px;
  margin-bottom: 10px;
}

%ifthenelse-widget__tag {
  font-family: Montserrat;
  font-size: 12px;
  font-weight: 600;
  font-stretch: normal;
  font-style: normal;
  line-height: 1.67;
  letter-spacing: normal;
  text-transform: uppercase;
  color: #2e69a3;
  display: inline-flex;
  border-radius: 2px;
  padding: 0 6px;
  background-color: #d7e5f3;
}

.ifthenelse-widget__else {
  @extend %ifthenelse-widget__tag;
  margin-bottom: 0px;
}

.ifthenelse-widget__if {
  @extend %ifthenelse-widget__tag;
}

.ifthenelse-widget__then {
  @extend %ifthenelse-widget__tag;
}
</style>
