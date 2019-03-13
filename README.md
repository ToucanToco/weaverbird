[![CircleCI](https://img.shields.io/circleci/project/github/ToucanToco/vue-query-builder.svg)](https://circleci.com/gh/ToucanToco/vue-query-builder)

# vue-query-builder

## Project setup

```bash
yarn install
```

### Start in a local environnement

```bash
yarn serve
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

```bash
yarn storybook
```

This will run [storybook](https://storybook.js.org/), displaying the stories
(use cases) of UI components.

Stories are defined in the `stories/` directory.


### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).
