# Writing your own translator

A translator is the piece of code responsible for translating a
list of _pipelines steps_ into anything you see fit. For intsance,
this packages comes with a `mongo36` translator that translates a list
of _pipeline steps_ into the list of corresponding mongo instructions.

You could imagine writing your own translator to output `SQL` code or
[pandas](https://pandas.pydata.org) code or just a plain human-readable text,
etc. We call each of this output type a "backend", that is a symbolic name for
the kind of output your translator produce. It has no specific meaning but we
would advise to keep it lowercase, short, readable and self-explanatory.

To define your own translator, you need to:

1. create a translator class extending the default `lib/translators/base:BaseTranslator` class

2. implement a transformation method for each pipeline step your backend supports

3. write tests for your backend

4. register your backend so that is it available

## Creating a transatlor class

All pipeline steps are defined in the `lib/steps` using typescript interfaces.
Each step type defines at least a `name` property which is required to be unique
among all possible step types. A generic `PipelineStep` type is defined as being
the union type of all available step types.

Your translator class will have to extend the `lib/translators/base:BaseTranslator` class and provide a transformation method for each supported step type. The method
name **has to match exactly** the name of step type. It should accept a `step` parameter with the correspding type and return whatever you need.

For intance, suppose that you want to support the `rename` and `filter` step
only, your translator module might look like:

```ts
import { BaseTranslator } from '@/lib/translators/base';
import { RenameStep, FilterStep } from '@/lib/steps';

class MyTranslator extends BaseTranslator {
  rename(step: RenameStep) {
    return 'rename!';
  }
  filter(step: FilterStep) {
    return 'filter!';
  }
}
```

…and that's it. The `BaseTranslator` class will provide additional facilities:

- a `supportedSteps` property that will return the list of steps supported by
  your backend. In our example case, it will return `['filter', 'rename']`

- an `unsupportedSteps` property which is the dual operation and will return
  the list of all unsupported steps

- a `translate` method which accepts an array of pipeline steps and return an
  array of whatever your transformation methods return. The default implementation
  is to iterate over all steps in the pipeline, call the corresponding transformation
  method and append the result to an output list. Of course, if you want something
  more clever, you can override the default implementation.

## Registering your translator

Use the `registerTranslator` helper:

```ts
import { registerTranslator } from '@/lib/translators';

class MyTranslator extends BaseTranslator {
  // implementation…
}

registerTranslator('my-backend', MyTranslator);
```

and make sure your module is imported somewhere so that `registerTranslator` gets called.

## Getting a translator

Most of the time, you'll know which backend you want to get a translator for. In this case, you'll just have to use the `getTranslator` method:

```ts
import { getTranslator } from '@/lib/translators';

const myTranslator = getTranslator('my-backend');
const outputSteps = myTranslator.translate(
  { name: 'domain', domain: 'my-domain' },
  { name: 'rename', oldname: 'old', newname: 'new' },
  { name: 'rename', oldname: 'old2', newname: 'new2' },
);
```

## Querying the registry

Sometimes, you'll just want to get some information on available backends
or all backends supporting a specific operation:

```ts
import { availableTranslators, backendsSupporting } from '@/lib/translators';

for (const [backend, translator] of Object.entries(availableTranslators)) {
  console.log(`backend ${backend} supports t${translator.supportedSteps}`);
}
```

Or, to get the list of backends supporting the 'rename' operation:

```ts
const backends = backendsSupporting('rename');
console.log(`${backends} supports the "rename" operation`);
```
