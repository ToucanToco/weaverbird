# About

The documentation uses [this jekyll theme](https://aksakalli.github.io/jekyll-doc-theme/)
(Copyright (c) 2017 Can Güney Aksakalli, licensed under MIT License)

## Running locally

You need Ruby/gem and bundler before starting, then:

```bash
# install bundler if you don't have it (may need sudo)
gem install bundler

# install dependencies
bundle install --path=vendor/bundle

# build the docs website
bundle exec jekyll serve
```

## Docker

Alternatively, you can deploy it using the multi-stage [Dockerfile](Dockerfile)
that serves files from Nginx for better performance in production.

```bash
# build the image
docker build -t weaverbird-docs .

# run it
docker run -p 4000:80 weaverbird-docs
```

Either way, the docs are available on the port 4000.

