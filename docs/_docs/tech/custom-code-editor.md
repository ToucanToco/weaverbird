---
title: Custom code editor
permalink: /docs/code-editor/
---

# Customize the code editor

The `custom step` allows user to write their own query step. It uses by default a basic textarea, but you might want to customize the code editor with the `setAvailableCodeEditors` interface.

## Example

Here is a simple example, on how to provide a textarea with a fix placeholder:

```js
setAvailableCodeEditors({
  defaultConfig: 'javascript',
  configs: {
    javascript: {
      props: ['value', 'placeholder'],
      render(createElement) {
        return createElement('textarea', {
          domProps: {
            value: this.value,
            placeholder: 'OMG I have to write code in javascript here',
          },
          attrs: {
            type: 'text',
          },
          on: {
            input: event => {
              this.$emit('input', event.target.value);
            },
            blur: event => {
              this.$emit('blur');
            },
            focus: event => {
              this.$emit('focus');
            },
          },
        });
      },
    },
    json: { ...config },
    html: { ...config },
  },
});
```

## API

`setAvailableCodeEditors`'s argument is an object:
- *defaultConfig* (opt): the config to use as default one
- *configs*: a list of configs associated to their lang key

A config is a Vue components with the following requirements:
- It must accept a `value` property and emit an `input` event
  as it will be used with a `v-model`

- Optionally:
  - emit `blur` and `focus` event
  - a `placeholder` property

After instanciation you can call a codeEditorWidget with the choosen `config` param to apply the associated config.
