# Known limitations

This doc section is to aimed to identify a non exhaustive list of limitations
that we have in mind, and that we want to tackle in further developments.

## Supported languages

- We only support mongo 3.6 at the moment

## Steps limitations

- We do not support transformation of text and date at the moment
- We do not support combination of several queries (such as append or join)
- Filter step: we only support "and" conditions (not "or")
- Formula step: we do not support column names that include whitespaces
