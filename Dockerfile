# This container can build and run weaverbird's front-end and the pandas back-end.
#
# Usage:
# $ docker build -t weaverbird-playground .
# $ docker run -p 3000:3000 -p 5000:5000 --rm -d weaverbird-playground
# and then access http://localhost:3000/?backend=pandas


FROM nikolaik/python-nodejs:python3.8-nodejs14

WORKDIR /weaverbird/

# Install front-end package dependecies
COPY ./package.json ./yarn.lock ./
RUN yarn

WORKDIR /weaverbird/server
# Install back-end package dependencies
COPY server/pyproject.toml ./
RUN poetry install

WORKDIR /weaverbird
# Build front-end package
COPY . ./
RUN yarn build

CMD yarn concurrently "yarn start" "cd server; FLASK_APP=playground FLASK_RUN_HOST=0.0.0.0 FLASK_RUN_PORT=5000 poetry run flask run"
EXPOSE 3000
EXPOSE 5000
