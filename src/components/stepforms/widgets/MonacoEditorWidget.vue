<template>
  <div class="vqb-monaco-editor" />
</template>
<script lang="ts">
import * as monaco from 'monaco-editor';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
@Component({
  name: 'vqb-monaco-editor-widget',
  components: {},
})
export default class VqbMonacoEditor extends Vue {
  @Prop({ type: String, default: null })
  id!: string;
  @Prop({ type: String, default: '' })
  name!: string;
  @Prop({ type: String, default: '' })
  code!: string;
  @Prop({ type: String, default: 'json' })
  lang!: string;
  @Prop({ type: Boolean, default: true })
  autofocus!: boolean;
  @Prop({ type: Object, default: () => {} })
  options!: object;
  editorInstance!: monaco.editor.IStandaloneCodeEditor;
  editorModel!: monaco.editor.ITextModel | null;
  async mounted() {
    this.editorInstance = await monaco.editor.create(this.$el as HTMLElement, {
      value: this.code,
      language: this.lang,
      automaticLayout: true,
      ...this.options,
    });
    this.editorModel = this.editorInstance.getModel();
    this.editorInstance.onKeyDown(e => {
      // Handle special case on MacOS where Chrome listen on same keys that permit to toggleComment lines
      if (e.code === 'Period' && e.shiftKey && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        this.editorInstance.getAction('editor.action.commentLine').run();
      }
      this.$emit('keydown', e);
    });
    if (this.editorModel) {
      this.editorModel.onDidChangeContent(() => {
        this.$emit('codeUpdated', (this.editorModel as monaco.editor.ITextModel).getValue());
      });
    }
    if (this.autofocus) {
      this.editorInstance.focus();
    }
  }
  beforeDestroyed() {
    if (this.editorInstance) {
      this.editorInstance.dispose();
    }
  }
  @Watch('code')
  updateCode(newVal: string) {
    if (newVal !== this.editorInstance.getValue()) {
      const prevPosition = this.editorInstance.getPosition();
      this.editorInstance.setValue(newVal);
      if (prevPosition) {
        this.editorInstance.setPosition(prevPosition);
      }
      this.editorInstance.focus();
    }
  }
}
</script>
<style lang="scss">
.vqb-monaco-editor {
  border: 1px solid #ccc;
  display: flex;
  height: 100%;
  min-height: 300px;
  position: relative;
  z-index: 0;
}
</style>
