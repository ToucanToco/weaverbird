FROM ruby:3 AS builder

WORKDIR /jekyll
COPY Gemfile Gemfile.lock /jekyll/
RUN bundle install

ENTRYPOINT ["jekyll"]
CMD ["serve", "--port", "4000", "--host", "0.0.0.0"]
