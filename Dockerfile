# This container can build and run weaverbird's front-end and the pandas back-end.
#
# Usage:
# $ docker build -t weaverbird-playground .
# $ docker run -p 5000:5000 --rm -d weaverbird-playground
# and then access http://localhost:5000/?backend=pandas

FROM node:14 AS ui-builder

WORKDIR /weaverbird

# Install npm dependencies
COPY package.json yarn.lock ./
RUN yarn

# Build UI
COPY . ./
RUN yarn build


FROM python:3.8 as server

WORKDIR /weaverbird/server

COPY server /weaverbird/server

# Install pypi dependencies for the playground
RUN pip install -e ".[playground]"

# Copy UI files
COPY --from=ui-builder /weaverbird/playground/dist/* /weaverbird/server/static/

# Copy sample datasets
COPY ./playground/datastore /weaverbird/playground/datastore

CMD hypercorn --bind 0.0.0.0:5000 playground:app
EXPOSE 5000
