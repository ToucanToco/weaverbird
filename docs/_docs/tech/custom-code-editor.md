---
title: Custom code editor
permalink: /docs/code-editor/
---

# Customize the code editor

The `custom step` allows user to write their own query step. It uses by default a basic textarea, but you might want to customize the code editor with the `setCodeEditor` interface. 

## Example

Here is a simple example, on how to provide a textarea with a fix placeholder:

```js
setCodeEditor({
  props:['value', 'placeholder'],
  render(createElement) {
    return createElement("textarea", {
      domProps: {
        value: this.value,
        placeholder: "OMG I have to write code in here",
      },
      attrs: {
        type: "text"
      },
      on: {
        input: (event) => {this.$emit('input', event.target.value)},
        blur: (event) => {this.$emit('blur')},
        focus: (event) => {this.$emit('focus')},
      },
    })
  },
});
```

## API

`setCodeEditor`'s argument is a Vue component with the following requirements:
  - It must accept a `value` property and emit an `input` event
    as it will be used with a `v-model`

  - Optionally:
    - emit `blur` and `focus` event
    - a `placeholder` property

# Use different config

`setAvailableCodeEditors` can be used to provide a list of custom codeEditor config.

## Example

```js
setAvailableCodeEditors(
  {
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
  'json',
);
```

## API

`setAvailableCodeEditors`'s argument is a list of Vue component (see `setCodeEditor` API) keyed to a lang param:
Then you can call a codeEditor with the choosen `lang` param to apply the associated config.
