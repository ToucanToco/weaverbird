---
title: Technical overview
permalink: /docs/tech
---

Weaverbird is a graphical user interface built that uses:

- [TypeScript](https://www.typescriptlang.org/) as main language,
- [VueJS](https://vuejs.org/) for the graphical user interface.

It doesn't include any "server-side" code, it aims at being a pure frontend
tool that will generate transformation queries or pipelines (e.g. MongoDB
aggregations, SQL queries, Python scripts).

The graphical users interface generates a list of [transformation
steps](/docs/steps/) that can be [translated](/docs/translators/) afterwards on
supported backends. For now, it only supports MongoDB.
