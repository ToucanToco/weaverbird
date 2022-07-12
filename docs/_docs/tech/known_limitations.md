---
title: Known limitations
permalink: /docs/known-limitations/
---

# Known limitations

This doc section is here to identify a non exhaustive list of limitations
that we have in mind, and that we want to tackle in further developments.

## Supported mongo versions

We only support mongo 4.4.x & 5.x at the moment.

## Result ordering with PyPika SQL translator

Because some SQL backends do no keep the original row ordering when grouping, JOINing or doing UNIONs,
several steps do an ORDER BY in order to ensure consistent result, meaning the inital row order is not
preserved.
