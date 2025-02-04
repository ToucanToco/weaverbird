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
import { defineComponent, PropType } from 'vue';

export default defineComponent({
  name: 'DefaultCodeEditor',
  props: {
    value: {
      type: String as PropType<string>,
      required: true,
    },
    placeholder: {
      type: String as PropType<string>,
      default: '',
    },
  },
});
</script>
<style scoped>
textarea {
  outline: none;
}
</style>
