<template>
  <div>
    <div class="step-edit-form">
      <h1 class="step-edit-form__title">Change your domain</h1>
    </div>
    <WidgetAutocomplete
      id="domainInput"
      v-model="domain"
      name="Change your domain:"
      :options="domains"
      placeholder="Choose a domain"
    ></WidgetAutocomplete>
    <div class="widget-form-action">
      <button
        class="widget-form-action__button widget-form-action__button--validate"
        @click="validateStep"
      >OK</button>
      <button
        class="widget-form-action__button widget-form-action__button--cancel"
        @click="cancelEdition"
      >Cancel</button>
    </div>
    <div v-if="errors" class="errors">
      <ul>
        <li v-for="(error, index) in errors" :key="index">{{ error.dataPath }}: {{ error.message }}</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { Mixins, Prop } from 'vue-property-decorator';
import FormMixin from '@/mixins/FormMixin.vue';
import domainSchema from '@/assets/schemas/domain-step__schema.json';
import WidgetAutocomplete from '@/components/stepforms/WidgetAutocomplete.vue';
import { State, Mutation } from 'vuex-class';
import { StepFormComponent } from '@/components/formlib';
import { MutationCallbacks } from '@/store/mutations';

interface DomainStepConf {
  domain: string;
}

@StepFormComponent({
  vqbstep: 'domain',
  name: 'domain-step-form',
  components: {
    WidgetAutocomplete,
  },
})
export default class DomainStepForm extends Mixins(FormMixin) {
  @Prop({
    type: Object,
    default: () => ({
      domain: '',
    }),
  })
  initialValue!: DomainStepConf;

  @Mutation selectStep!: MutationCallbacks['selectStep'];
  @State domains!: string[];

  domain: string = this.initialValue.domain;

  created() {
    this.schema = domainSchema;
  }

  validateStep() {
    const ret = this.validator({ domain: this.domain });
    if (ret === false) {
      this.errors = this.validator.errors;
    } else {
      this.errors = null;
      this.$emit('formSaved', { name: 'domain', domain: this.domain });
      this.selectStep({ index: 0 });
    }
  }

  cancelEdition() {
    this.$emit('cancel');
  }
}
</script>
<style lang="scss" scoped>
@import '../../styles/_variables';

.widget-form-action__button {
  @extend %button-default;
}

.widget-form-action__button--validate {
  background-color: $active-color;
}

.step-edit-form {
  border-bottom: 1px solid $grey;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding-bottom: 20px;
  margin: 10px 0 15px;
  width: 100%;
}

.step-edit-form__title {
  color: $base-color;
  font-weight: 600;
  font-size: 14px;
  margin: 0;
}
</style>
