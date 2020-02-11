<template>
  <textarea
    :placeholder="placeholder"
    :value="value"
    type="text"
    @input="$emit('input', $event.target.value)"
    @blur="$emit('blur')"
    @focus="$emit('focus')"
  />
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

@Component({
  name: 'DefaultCodeEditor',
})
export default class DefaultCodeEditor extends Vue {
  @Prop({
    type: String,
    required: true,
  })
  value!: string;

  @Prop({
    type: String,
    default: '',
  })
  placeholder!: string;
}
</script>
<style scoped>
textarea {
  outline: none;
}
</style>
