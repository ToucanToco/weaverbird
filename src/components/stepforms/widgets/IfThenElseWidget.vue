<template>
  <div class="ifthenelse-widget">
    <div class="ifthenelse-widget__container">
      <div class="ifthenelse-widget__row">
        <div class="ifthenelse-widget__cell">
          <div class="ifthenelse-widget__if">{{ isRoot ? 'IF' : 'ELSE IF' }}</div>
        </div>
      </div>
      <div class="ifthenelse-widget__row">
        <div class="ifthenelse-widget__cell">
          <FilterEditor
            :filter-tree="value.if"
            :errors="errors"
            :data-path="`${dataPath}.if`"
            @filterTreeUpdated="updateFilterTree"
          />
        </div>
      </div>
      <div class="ifthenelse-widget__row ifthenelse-widget__row--step">
        <div class="ifthenelse-widget__cell">
          <div class="ifthenelse-widget__then">THEN</div>
        </div>
      </div>
      <div class="ifthenelse-widget__row">
        <div class="ifthenelse-widget__cell">
          <InputTextWidget
            class="ifthenelse-widget__input"
            :value="value.then"
            @input="updateThenFormula"
            placeholder='Enter a "Text" with quotes, or a formula'
            :data-path="`${dataPath}.then`"
            :errors="errors"
          />
        </div>
      </div>
      <template v-if="elseMode === 'ELSE:'">
        <div class="ifthenelse-widget__row ifthenelse-widget__row--step">
          <div class="ifthenelse-widget__cell">
            <div class="ifthenelse-widget__else">ELSE</div>
          </div>
        </div>
        <div class="ifthenelse-widget__row">
          <div class="ifthenelse-widget__cell">
            <InputTextWidget
              class="ifthenelse-widget__input"
              :value="value.else"
              @input="updateElseFormula"
              placeholder='Enter a "Text" with quotes, or a formula'
              :data-path="`${dataPath}.else`"
              :errors="errors"
            />
          </div>
        </div>
      </template>
    </div>
    <ifthenelse-widget
      v-if="elseMode === 'ELSE IF:'"
      :value="value.else"
      @input="updateElseObject"
      @delete="updateElseMode('ELSE:')"
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
%ifthenelse-widget__text {
  font-family: Montserrat;
  font-weight: 600;
  letter-spacing: 0.25px;
  text-transform: uppercase;
  color: #2e69a3;
}

%ifthenelse-widget__tag {
  @extend %ifthenelse-widget__text;
  font-size: 12px;
  line-height: 1.67;
  display: inline-flex;
  border-radius: 2px;
  padding: 0 6px;
  background-color: #e2ebf5;
  margin-bottom: 10px;
}

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

.ifthenelse-widget {
  .ifthenelse-widget__input {
    margin: 0;
    background-color: white;
  }
  .conditions-group {
    padding-bottom: 0;
    &:not(.conditions-group--with-switch) {
      padding-top: 0;
    }
  }
}

.ifthenelse-widget__container {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 5px;
  background-color: #f9fbfc;
}

.ifthenelse-widget__row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-left: 10px;
}

.ifthenelse-widget__row--step {
  padding-top: 15px;
}

.ifthenelse-widget__cell {
  flex: 1;
}

.ifthenelse-widget__if,
.ifthenelse-widget__then,
.ifthenelse-widget__else {
  @extend %ifthenelse-widget__tag;
}

.ifthenelse-widget__if {
  margin-bottom: 0px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 5s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
