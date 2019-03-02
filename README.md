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

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).
