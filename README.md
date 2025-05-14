# <img src="docs/img/logonav.png" alt="GitHub Logo" width="30"/> Weaverbird

!["Weaverbird Screenshot](docs/img/readme_screenshot.png)

Weaverbird is [Toucan Toco](https://toucantoco.com)'s data pipelines toolkit, it contains :

- a pipeline **Data Model**, currently supporting more than 40 transformation steps
- a friendly **User Interface** for building those pipelines without writing any code,
  made with TypeScript, VueJS & VueX
- a set of **BackEnds** to use those pipelines :
  - the MongoDB Translator that generate Mongo Queries, written in TypeScript
  - the Pandas Executor that compute the result using Pandas dataframes, written in Python
  - the Snowflake SQL translator, written in Python

For in depth user & technical documentation, have a look at [weaverbird.toucantoco.dev](https://weaverbird.toucantoco.dev)
or at the documentation's source files in the `docs` directory.

## Badges

### UI

[![npm](https://img.shields.io/npm/v/weaverbird)](https://www.npmjs.com/package/weaverbird)
![CI UI](https://github.com/ToucanToco/weaverbird/actions/workflows/ci-ui.yml/badge.svg)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=ToucanToco_weaverbird_ui&metric=coverage)](https://sonarcloud.io/dashboard?id=ToucanToco_weaverbird)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=ToucanToco_weaverbird_ui&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=ToucanToco_weaverbird)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=ToucanToco_weaverbird_ui&metric=ncloc)](https://sonarcloud.io/dashboard?id=ToucanToco_weaverbird)

<!-- [![Codecov Coverage](https://img.shields.io/codecov/c/github/ToucanToco/weaverbird.svg?style=flat-square)](https://codecov.io/gh/ToucanToco/weaverbird/) -->

### Server

[![pypi](https://img.shields.io/pypi/v/weaverbird)](https://pypi.org/project/weaverbird/)
![CI server](https://github.com/ToucanToco/weaverbird/actions/workflows/ci-server.yml/badge.svg)

## Project setup

```bash
yarn install
```

> See Dockerfile for supported node version

### Compiles target library

```bash
yarn build-bundle
```

This will generate an importable JS `weaverbird` library in the `dist` directory.

**Important note**: While we do our best to embrace [semantic versioning](https://semver.org/),
we do not guarantee full backward compatibility until version 1.0.0 is released.

### Run your tests

The basic command to run all tests is:

```bash
yarn test
```

### Lints and fixes files

```bash
yarn format:fix
yarn lint --fix
```

### Build the API documentation

```bash
yarn build-doc
```

This will run [typedoc](https://typedoc.org/) on the `src/` directory and
generate the corresponding documentation in the `dist/docs` directory.

### Build and run the documentation website

The web documentation is powered by [Jekyll](https://jekyllrb.com).
All sources can be found in the `docs` folder.
To build and run the documentation with docker:

```bash
cd docs/
docker buildx build -t weaverbird-jekyll .
docker container run --rm -p 4000:4000 -v $PWD:/jekyll weaverbird-jekyll
```

Once the docs are be built, they'll be available on `http://localhost:4000`. Any change to a `.md` source
file will trigger a rebuild.

#### Enrich it!

> put your `.md` file into the `docs` folder. You can add a folder as well to better organization

> into your `.md` file don't forget to declare this at the beginning of the file :

```
---
title: your title doc name
permalink: /docs/your-page-doc-name/
---
```

> to finish to get your page into the doc navigation you have to add it in `\_data/docs.yml``

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

```bash
yarn storybook
```

This will run [storybook](https://storybook.js.org/), displaying the stories
(use cases) of UI components.

Stories are defined in the `stories/` directory.

## Publication

This library is published on npm under the name `weaverbird` automatically each time a release is created in GitHub.

### Create a release (frontend)

- Define new version using [semantic versioning](https://semver.org/)

- Create a new local branch `release/X.Y.Z` from master

  ex: `release/0.20.0`

- Update the `version` property in `package.json` and in `sonar-project.properties`

- Check differences between last release and current and fill `CHANGELOG.md` with updates

  - Delete the `##changes` title at start of the `CHANGELOG.md` if provided
  - Add the date and version at start of `CHANGELOG.md` following this convention

    ```
    [X.Y.Z] - YYYY-MM-DD
    ```

    ex: `[0.20.0] - 2020-08-03`

- Commit changes with version number

  ex: `v0.20.0`

- Push branch

- Create a pull request into master from your branch

- When pull request is merged, [create a release](https://github.com/ToucanToco/weaverbird/releases) with the version number in tag version and title (no description needed)

  ex: `v0.20.0`

- Hit the release "publish release" button (this will automatically create a tag and trigger the [package publication](https://github.com/ToucanToco/weaverbird/actions?query=workflow%3A%22npm+publish%22) )

### Create a release (backend)

- Create a new local branch `chore/bump-server-version-x-x-x`

- Edit `server/pyproject.toml` & increment the version in `[tool.poetry]` section

- Push branch

- Create a pull request into master from your branch

- Once the PR is approved & merged in master publish the release in Pypi with `make build` & `make upload`

## Usage as library

### Without any module bundler

```html
<!-- Import styles -->
<link rel="stylesheet" href="weaverbird/dist/weaverbird.umd.min.js" />

<!-- Import scripts -->
<script src="vue.js"></script>
<script src="weaverbird/dist/weaverbird.umd.min.js"></script>
```

### With an ES module bundler (typically webpack, vite or rollup)

```js
import { Pipeline } from "weaverbird";
```

> By default, the CommonJS module is imported. If you prefer the ES module
> version, import `dist/weaverbird.esm.js`.

## API

### Modules

See the documentation generated in `dist/docs` directory
