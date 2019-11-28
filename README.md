[![Codecov Coverage](https://img.shields.io/codecov/c/github/ToucanToco/weaverbird.svg?style=flat-square)](https://codecov.io/gh/ToucanToco/weaverbird/)
[![CircleCI](https://img.shields.io/circleci/project/github/ToucanToco/weaverbird.svg)](https://circleci.com/gh/ToucanToco/weaverbird)

# weaverbird

## General documentation

The project's technical and user documentation is hosted on https://weaverbird.toucantoco.com
The documentation's source files can be found in the `docs` directory.

## Project setup

```bash
yarn install
```

**Requirement: node > v11**

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

To run a single test file:

```bash
yarn test:unit path/to/yourfile.ts
```

Finally, you can deactivate typescript checks to run tests quicker:

```bash
yarn test:quick
```

This can be useful to accelerate your development cycle temporarily when
developing a new feature or fixing a bug. Under the hood, this will use the
`babel-jest` transformer on typescript files instead of `ts-jest`.

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

### Build and Run documentation (local environnement)

> The web documentation is powered by [Jekyll](https://jekyllrb.com).

> You can find all the sources into the `doc-build` folder.

> To build and locally launch the documentation you need Ruby and gem before starting, then:

```bash
# install bundler
gem install bundler

# run jekyll and a local server with dependencies :
bundle exec jekyll serve
```

#### how to add doc to jekyll documentation

> put your `.md` file into the `docs` folder. You can add a folder as well to better organization

> into your `.md` file don't forget to declare this at the beginning of the file :

```
---
title: your title doc name
permalink: /docs/your-page-doc-name/
---
```

> to finish to get your page into the doc navigation you have to add it in `_data/docs.yml``

example :
```
- title: Technical documentation
  docs:
  - steps
  - stepforms
  - your-page-doc-name
```

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

### Without any module bundler

```html
<!-- Import styles -->
<link rel="stylesheet" href="weaverbird/dist/weaverbird.umd.min.js" />

<!-- Import scripts -->
<script src="vue.js"></script>
<script src="weaverbird/dist/weaverbird.umd.min.js"></script>
```

### With an ES module bundler (typically webpack or rollup)

```js
import { Pipeline } from 'weaverbird';
```

> By default, the CommonJS module is imported. If you prefer the ES module
> version, import `dist/weaverbird.esm.js`.

### Styles

If your module bundler can also import CSS (e.g. via `styles-loader`):

```js
import 'weaverbird/dist/weaverbird.css';
```

If you prefer to use Sass, you may import directly the scss:

```scss
@import '~weaverbird/src/styles/main';
```

> This example makes use of the `~` syntax from webpack's [sass-loader](https://github.com/webpack-contrib/sass-loader)
> to resolve the imported modules.

## API

### Modules

See the documentation generated in `dist/docs` directory

### Styles

TODO: document here sass variables that can be overriden

## Playground

The `/playground` directory hosts a demo application with a small server that
showcases how to integrate the exported components and API. To run it, just
run:

```bash
yarn playground
```

which is basically a shortcut for the following steps:

```bash
# build the visual query builder bundle
yarn build-bundle --watch
# run the server and enjoy!
node playground/server.js
```

Once the server is started, you should be able to open the
`http://localhost:3000` in your favorite browser and enjoy!

The `server.js` script reads the `playground/playground.config.json` config file
to know which database should be queried or which http port should be used. If
you want to customize these values, either edit this json file or override each
available option on the commandline, e.g.

```bash
node playground/server.js --dburi mongodb://localhost:27018
```

You can also customize options through environment variables with the following
naming pattern `VQB_PLAYGROUND_{OPTION}`, e.g.

```bash
VQB_PLAYGROUND_DBURI=mongodb://localhost:27018 node playground/server.js
```

You can use the default test dataset by loading the `playground/default-dataset.csv` file. To do that, use the following command line:

```bash
node playground/server.js --reset
```

If you want to use a custom CSV file, use the `defaultDataset` command line option:

```bash
node playground/server.js --defaultDataset my-dataset.csv --reset
```

If you don't have mongodb installed, you can use the `--automongo` flag from the
command line. It will use
[mongodb-prebuilt](https://github.com/winfinit/mongodb-prebuilt) to download
(the first time) and run mongo `3.6.12` and then listen on the port guessed from
the `--dburi` flag.
