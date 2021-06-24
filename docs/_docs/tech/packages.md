---
title: Packages
permalink: /docs/packages/
---

Weaverbird publishes two packages:

- a [npm package](https://www.npmjs.com/package/weaverbird)
- a [python package](https://pypi.org/project/weaverbird/)

## NPM package

The npm package contains two concerns:
- a graphical user interface,
- some translators.

Its main language is [TypeScript](https://www.typescriptlang.org/). 

### GUI

The graphical user interface generates a list of [transformation
steps](/docs/steps/) that can be [translated](/docs/translators/) afterwards on
supported backends.

See [UI components](/docs/ui-components) for more details on usable components.

### Translators

Translators serves two purposes today:
- declaring a set of supported steps so only display these steps
- optionally provide a way to translate a pipeline into a query understandable by a backend

See [how to write a new translator](/docs/translators) for a deep-dive. 

## Python package

The python module provide a way to run transformations described in a pipeline.
Its code reside in the `server/` folder.

More info in its [dedicated usage docs](/docs/python-package).
