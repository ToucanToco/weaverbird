[![CircleCI](https://img.shields.io/circleci/project/github/ToucanToco/vue-query-builder.svg)](https://circleci.com/gh/ToucanToco/vue-query-builder)

# vue-query-builder

## Project setup

```bash
yarn install
```

### Compiles and minifies for production

```bash
yarn build
```

### Compiles target library

```bash
yarn build-bundle
```

This will generate an importable JS `VisualQueryBuilder` library in the `dist` directory.

### Run your tests

The basic command to run all tests is:

```bash
yarn test:unit
```

You can also use a watcher so that tests rerun automatically
on a change:

```bash
yarn test:unit --watchAll
```

`yarn test:unit` is just a shortcut for `vue-cli-service test:unit` so you
can pass command line options to `jest` directly. For instance:

```bash
yarn test:unit tests/unit/pipebuild.spec.ts --bail
```

### Lints and fixes files

```bash
yarn lint
```

### Build the documentation

```bash
yarn build-doc
```

This will run [typedoc](https://typedoc.org/) on the `src/` directory and
generate the corresponding documentation in the `dist/docs` directory.


### Run the storybook

> Storybook uses the bundled lib, so all showcased components must be in the public API.

In one terminal:
```bash
yarn storybook:bundle --watch
```

In another:
```bash
yarn storybook
```

This will run [storybook](https://storybook.js.org/), displaying the stories
(use cases) of UI components.

Stories are defined in the `stories/` directory.


### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).


## Usage as library

### Peer dependencies
This library requires some dependencies that are not bundled with it:
- lodash >4
- vue >2

### Without any module bundler
```html
<!-- Import styles -->
<link rel="stylesheet" href="vue-query-builder/dist/vue-query-builder.umd.min.js">

<!-- Import scripts -->
<script src="vue.js"></script>
<script src="lodash.js"></script>
<script src="vue-query-builder/dist/vue-query-builder.umd.min.js"></script>
```

### With an ES module bundler (typically webpack or rollup)
```js
import { Pipeline } from 'vue-query-builder'
```

> By default, the CommonJS module is imported. If you prefer the ES module
  version, import `dist/vue-query-builder.esm.js`.

### Styles
If your module bundler can also import CSS (e.g. via `styles-loader`):
```js
import 'vue-query-builder/dist/vue-query-builder.css'
```

If you prefer to use Sass, you may import directly the scss:
```scss
@import '~vue-query-builder/src/styles/main';
```

 > This example makes use of the `~` syntax from webpack's [sass-loader](https://github.com/webpack-contrib/sass-loader)
  to resolve the imported modules.


## API

### Modules
See the documentation generated in `dist/docs` directory

### Styles
TODO: document here sass variables that can be overriden
