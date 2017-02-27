## Motivations

JavaScript templating is often done through string based template engines.

I wanted to try using AST trees directly instead, it has some advantages:
- templates remain valid JavaScript. You can just test it by running
 `node my.tpl.js`.
- your linter/syntax highlighter, auto-completer just works,
- i had fun coding it :p

Since JavaScript identifiers syntax accepts some Emojis, we can add some extra
 informations right into them to bring some logic in.

**Disclaimer:** This module is just an experiment, use it at your own risks.

## Usage
```js
const asttpl = require('asttpl');

// Here we repeat the property assignation
// for each methods
// The repeat transformation create a context in
// which the object it currently iterates on
// can provide values to subtree of the AST
// see the transformations section for more details
const template = `
module.exports = {
  𐅙repeat𐅙methods𐅙name: 𐅙literal𐅙name𐅂upper
};
`;

// Filters may be set to templated values
const filters = {
  upper: str => str.toUpperCase()
};

const data = {
  methods: [{
    name: 'get'
  }, {
    name: 'put'
  }]
};

// Template values are picked into the data
// variable but you can provide several sources
// for templating, this is why the third argument
// is an array
assert.equal(asttpl({ filters }, template, [data])`
module.exports = {
  get: 'GET',
  put: 'PUT',
};
`);

```

## Transformations

This is just a simple summary but you should look at the tests to see how it
 really works.

### Variable replacement

**Pattern:** 𐅙variable𐅙`${path}`𐅂`${filter1}`𐅂`${filter2}`𐅂`${filterN}`
**Usage:**
- function names
- variables declarations
- variables lookups
- property names

Replace a variable name by its matched value after applying it given filters if
 any. Changing:
```
let 𐅙variable𐅙myPath𐅂myFilter;
```
To:
```
let myShinyNewName;
```

### Literal replacement

**Pattern:** 𐅙literal𐅙`${path}`𐅂`${filter1}`𐅂`${filter2}`𐅂`${filterN}`
**Usage:**
- variables lookups

Change a variable by a literal with its matched value. Changing:
```
const myConstant = 𐅙literal𐅙myPath𐅂myFilter;
```
To:
```
const myConstant = 'myGeneratedValue';
```

### Loops

**Pattern:** 𐅙repeat𐅙${entriesPath}𐅂`${filter1}`𐅂`${...filterN}``𐅙${namePath}𐅂`${filter1}`𐅂`${...filterN}
**Usage:**
- variables declarations
- functions declarations
- object patterns

Repeat functions/variable/properties declarations. Changing:
```
const myConstant = {
  𐅙repeat𐅙myEntriesPath𐅂myFilter𐅙myNamePath𐅂myFilter: 𐅙literal𐅙myRelativePath
};
```
To:
```
const myConstant = {
  myProp1: 'myRelativeValue1',
  myProp2: 'myRelativeValue2',
  myProp3: 'myRelativeValue3'
};
```

### Custom transformations

**Pattern:** 𐅙transform𐅙${transformationName}𐅙${path}
**Usage:**
- any identifier

Apply custom `transformationName` to the identifier and the `path` resolved
 values.

## Template values picker

Values used for templates are picked with `miniquery`. Refer to
 [its documentation](https://github.com/SimpliField/miniquery) for more details.

The following path characters had to be mapped in order to keep syntactically
 valid templates:
- the path separator `.` becomes `𐅞`,
- the wildcard `*` becomes `𐅆`,
- the array items matcher `#` becomes `𐅅`,
- the object properties matcher `@` becomes `𐅄`.
