<template>
  <div class="ifthenelse-widget">
    <div
      class="ifthenelse-widget__container"
      :class="{ 'ifthenelse-widget__container--collapsed': collapsed }"
    >
      <div class="ifthenelse-widget__row ifthenelse-widget__row--tag">
        <span class="ifthenelse-widget__collapse-button" @click="toggle" />
        <div class="ifthenelse-widget__tag">{{ isRoot ? 'IF' : 'ELSE IF' }}</div>
        <div
          v-if="!isRoot && !collapsed"
          class="ifthenelse-widget__remove"
          @click="deleteCondition"
        >
          <i class="far fa-trash-alt" />
        </div>
        <template v-if="collapsed">
          <div class="ifthenelse-widget__collapse-description" v-html="description" />
          <div class="ifthenelse-widget__collapse-text" @click="toggle">
            EXPAND
          </div>
        </template>
      </div>
      <div class="ifthenelse-widget__row ifthenelse-widget__row--condition">
        <FilterEditor
          :filter-tree="value.if"
          :errors="errors"
          :data-path="`${dataPath}.if`"
          @filterTreeUpdated="updateFilterTree"
        />
      </div>
      <div class="ifthenelse-widget__row ifthenelse-widget__row--tag">
        <div class="ifthenelse-widget__tag">THEN</div>
      </div>
      <div class="ifthenelse-widget__row ifthenelse-widget__row--input">
        <InputTextWidget
          class="ifthenelse-widget__input"
          :value="value.then"
          @input="updateThenFormula"
          placeholder='Enter a "Text" with quotes, or a formula'
          :data-path="`${dataPath}.then`"
          :errors="errors"
        />
      </div>
      <template v-if="elseMode === 'ELSE:'">
        <div class="ifthenelse-widget__row ifthenelse-widget__row--tag">
          <div class="ifthenelse-widget__tag">ELSE</div>
        </div>
        <div class="ifthenelse-widget__row ifthenelse-widget__row--input">
          <InputTextWidget
            class="ifthenelse-widget__input"
            :value="value.else"
            @input="updateElseFormula"
            placeholder='Enter a "Text" with quotes, or a formula'
            :data-path="`${dataPath}.else`"
            :errors="errors"
          />
        </div>
        <div class="ifthenelse-widget__row ifthenelse-widget__row--add">
          <div class="ifthenelse-widget__add" @click="addNestedCondition">
            Add nested condition
          </div>
        </div>
      </template>
    </div>
    <ifthenelse-widget
      v-if="elseMode === 'ELSE IF:'"
      :value="value.else"
      @input="updateElseObject"
      @delete="deleteNestedCondition"
      :data-path="`${dataPath}.else`"
      :errors="errors"
    />
  </div>
</template>

<script lang="ts">
import { ErrorObject } from 'ajv';
import { Component, Prop, Vue } from 'vue-property-decorator';

import convertIfThenElseToHumanFormat from '@/components/convert-if-then-else-to-human-format';
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
  collapsed = false;

  get description() {
    return convertIfThenElseToHumanFormat(this.value);
  }

  get elseMode() {
    return typeof this.value.else === 'string' ? 'ELSE:' : 'ELSE IF:';
  }

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

  updateElseObject(elseObject: Omit<IfThenElseStep, 'name' | 'newColumn'> | string) {
    this.$emit('input', {
      ...this.value,
      else: elseObject,
    });
  }

  addNestedCondition() {
    this.updateElseObject({
      if: { column: '', value: '', operator: 'eq' },
      then: '',
      else: '',
    });
  }

  deleteNestedCondition() {
    if (typeof this.value.else === 'string') {
      return;
    } else {
      this.collapsed = false;
      this.updateElseObject(this.value.else.else);
    }
  }

  deleteCondition() {
    this.$emit('delete');
  }

  toggle() {
    this.collapsed = !this.collapsed;
  }
}
</script>

<style lang="scss" scoped>
@import '../../../styles/_variables';

.ifthenelse-widget__container {
  margin-bottom: 15px;
  padding: 10px;
  border-radius: 5px;
  background-color: #f9fbfc;
}

.ifthenelse-widget__container--collapsed {
  background-color: #fbfbfb;
  .ifthenelse-widget__row:not(:first-child) {
    display: none;
  }
  .ifthenelse-widget__collapse-button {
    transform: translateY(-50%) rotate(180deg);
    &:before {
      border-color: #d9d9d9 transparent transparent;
    }
  }
  .ifthenelse-widget__tag {
    background-color: $grey;
    color: black;
  }
}

.ifthenelse-widget__row {
  position: relative;
  padding: 0 10px 0 15px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

%ifthenelse-widget__text {
  font-family: Montserrat;
  font-weight: 600;
  text-transform: uppercase;
  color: $active-color;
}

%ifthenelse-widget__button {
  @extend %ifthenelse-widget__text;
  letter-spacing: 1px;
  font-size: 10px;
  cursor: pointer;
  &:hover {
    color: black;
  }
}

.ifthenelse-widget__tag {
  @extend %ifthenelse-widget__text;
  font-size: 12px;
  line-height: 1.67;
  display: inline-flex;
  border-radius: 2px;
  padding: 0 6px;
  margin-top: 15px;
  margin-bottom: 10px;
  background-color: #e2ebf5;
  flex: 0 auto;
}

.ifthenelse-widget__row--tag:first-child {
  .ifthenelse-widget__tag {
    margin: 0;
  }
}

.ifthenelse-widget__collapse-button {
  position: absolute;
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
  padding: 10px 5px;
  transition: transform 0.4s;
  cursor: pointer;
  &:before {
    content: '';
    display: block;
    border-color: #b8cce0 transparent transparent;
    border-width: 5px 5px 0;
    border-style: solid;
  }
}

.ifthenelse-widget__collapse-text {
  @extend %ifthenelse-widget__button;
  flex: 0 auto;
}

.ifthenelse-widget__collapse-description {
  flex: 1;
  padding: 0 10px;
  font-family: Montserrat;
  font-size: 12px;
  line-height: 1.5;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;

  /deep/ strong {
    font-size: 10px;
  }
}

.ifthenelse-widget__remove {
  color: #aaaaaa;
  float: right;
}

.ifthenelse-widget__add {
  @extend %ifthenelse-widget__button;
  margin-top: 15px;
}

//timeline decorations

%ifthenelse-widget__timeline-vertical {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  border-left: 1px solid #d7e5f3;
  width: 1px;
}

%ifthenelse-widget__timeline-horizontal {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  border-bottom: 1px solid #d7e5f3;
  width: 8px;
}

.ifthenelse-widget__row {
  // start timeline at end of first row ...
  &:first-child:before {
    display: none;
  }
  // ... and end timeline to middle of last row
  &:last-child:not(.ifthenelse-widget__row--add):before {
    bottom: 50%;
  }
}

.ifthenelse-widget__row--tag {
  &:before {
    @extend %ifthenelse-widget__timeline-vertical;
  }
}

.ifthenelse-widget__row--input {
  &:before {
    @extend %ifthenelse-widget__timeline-vertical;
  }
  &:after {
    @extend %ifthenelse-widget__timeline-horizontal;
  }
}

.ifthenelse-widget__row--condition {
  &:before {
    @extend %ifthenelse-widget__timeline-vertical;
  }
  &:after {
    @extend %ifthenelse-widget__timeline-horizontal;
    top: 25px;
  }
}

.ifthenelse-widget__row--add {
  &:before {
    @extend %ifthenelse-widget__timeline-vertical;
    border-left-style: dashed;
    bottom: 25%;
  }
  &:after {
    @extend %ifthenelse-widget__timeline-horizontal;
    border-bottom-style: dashed;
    top: 75%;
  }
}
</style>

<style lang="scss">
@import '../../../styles/_variables';
.ifthenelse-widget {
  .ifthenelse-widget__input {
    margin: 0;
    background-color: #e9eff5;
    padding: 5px;
    border: 1px solid $grey;
    border-radius: 5px;
  }
  .widget-input-text {
    background: white;
  }
  .filter-editor {
    width: 100%;
  }
  .conditions-group {
    padding-bottom: 0;
    &:not(.conditions-group--with-switch) {
      padding-top: 0;
    }
  }
  .condition-row {
    background-color: #e9eff5;
  }
}
</style>
