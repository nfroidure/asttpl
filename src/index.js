'use strict';

const debug = require('debug')('asttpl');
const YError = require('yerror');
const miniquery = require('miniquery');
const deepClone = require('deep-clone');
const recast = require('recast');
const types = require('ast-types');
const namedTypes = types.namedTypes;
const builders = types.builders;

const DEFAULT_RECAST_OPTIONS = { tabWidth: 2, quote: 'single' };
const VARIABLE_PREFIX = '𐅙variable𐅙';
const LITERAL_PREFIX = '𐅙literal𐅙';
const LOOP_PREFIX = '𐅙repeat𐅙';
const LOOP_SEPARATOR = '𐅙';
const TRANSFORM_PREFIX = '𐅙transform𐅙';
const TRANSFORM_SEPARATOR = '𐅙';
const FILTERS_SEPARATOR = '𐅂';
const PATH_SEPARATOR = /𐅞/g;
const ENCODED_HASH = /𐅅/g;
const ENCODED_WILCARD = /𐅆/g;
const ENCODED_AROBASE = /𐅄/g;

module.exports = compileTpl;

/**
 * Compile an run a template
 * @param {Object} context Context (destructured)
 * @param  {Object} context.transformations     Map for template transformations
 * @param  {Object} context.filters             Map for filter filters
 * @param  {Object} context.recastOptions       Recast options object
 * @param  {String} template            The actual template
 * @param  {Array<Object>} valuesStack  The values to fill the template
 * @return {String}                     The templating result
 */
function compileTpl({ transformations, filters, recastOptions }, template, valuesStack) {
  const ast = recast.parse(template);

  types.visit(ast, createVisitor({
    valuesStack,
    transformations: transformations || {},
    filters: filters || {},
  }));

  return recast.prettyPrint(ast, recastOptions || DEFAULT_RECAST_OPTIONS).code;
}

function createVisitor(context) {
  return {
    visitIdentifier: thisSafeBind(visitIdentifier, context),
    visitObjectExpression: thisSafeBind(visitObjectExpression, context),
    visitBlockStatement: thisSafeBind(visitBlockStatement, context),
    visitProgram: thisSafeBind(visitBlockStatement, context),
    visitObjectPattern: thisSafeBind(visitObjectPattern, context),
  };
}

// Since the AST traversal tool use this, have to do this ugly hack
function thisSafeBind(fn, ...args) {
  return function thisSafelyBinded(...childArgs) {
    const newArgs = args.concat(childArgs);

    return fn.call(this, ...newArgs);
  };
}

function visitIdentifier(context, path) {
  const identifierNode = path.node;
  let result;

  if(
    identifierNode.name &&
    identifierNode.name.startsWith(VARIABLE_PREFIX)
  ) {
    debug(
      'Found valued Identifier "' + identifierNode.name + '"' +
      printLine(identifierNode.loc)
    );
    result = processIdentifierRename(context, identifierNode, path);
  }

  if(
    identifierNode.name &&
    identifierNode.name.startsWith(LITERAL_PREFIX)
  ) {
    debug(
      'Found literal replaced Identifier "' + identifierNode.name + '"' +
      printLine(identifierNode.loc)
    );
    result = processIdentifierToLiteral(context, identifierNode, path);
  }

  if(
    identifierNode.name &&
    identifierNode.name.startsWith(TRANSFORM_PREFIX)
  ) {
    debug(
      'Found tranformed Identifier "' + identifierNode.name + '"' +
      printLine(identifierNode.loc)
    );
    result = processNodeTransform(context, identifierNode, path);
  }

  if(false !== result) {
    this.traverse(path);
  }
  return result;
}

function processIdentifierRename(context, identifierNode, path) {
  const [valuePath, ...filterNames] = identifierNode.name
    .substr(VARIABLE_PREFIX.length).split(FILTERS_SEPARATOR);
  const newNode = deepClone(identifierNode);
  const newName = miniquery(
    translatePath(valuePath),
    context.valuesStack
  )[0];

  if(!newName) {
    throw new YError('E_NO_NAME', identifierNode.name);
  }
  newNode.name = applyFilters(
    context,
    filterNames,
    newName
  );

  path.replace(newNode);
}

function processIdentifierToLiteral(context, identifierNode, path) {
  const [valuePath, ...filterNames] = identifierNode.name
    .substr(LITERAL_PREFIX.length).split(FILTERS_SEPARATOR);
  const literalValue = applyFilters(
    context,
    filterNames,
    miniquery(
      translatePath(valuePath),
      context.valuesStack
    )[0]
  );

  if(namedTypes.FunctionDeclaration.check(path.parentPath.node)) {
    throw new YError('E_BAD_LITERAL', 'FunctionDeclaration');
  }

  if(
    namedTypes.VariableDeclarator.check(path.parentPath.node) &&
    path.parentPath.node.init !== path.node
  ) {
    throw new YError('E_BAD_LITERAL', 'VariableDeclarator');
  }

  if(
    namedTypes.Property.check(path.parentPath.node) &&
    path.parentPath.node.value !== path.node
  ) {
    throw new YError('E_BAD_LITERAL', 'Property');
  }

  if(
    namedTypes.MemberExpression.check(path.parentPath.node)
  ) {
    throw new YError('E_BAD_LITERAL', 'MemberExpression');
  }

  if(!literalValue) {
    path.replace(builders.memberExpression(
      builders.objectExpression([]),
      builders.identifier('undef')
    ));
    return;
  }

  if(namedTypes.ExpressionStatement.check(path.parentPath.node)) {
    path.parentPath.replace(builders.literal(literalValue));
  } else {
    path.replace(builders.literal(literalValue));
  }
}

function processNodeTransform(context, node, path) {
  const [transformationName, valuePath] = node.name.substr(TRANSFORM_PREFIX.length)
    .split(TRANSFORM_SEPARATOR);
  const values = valuePath ? miniquery(valuePath, context.valuesStack) : context.valuesStack;
  const transformation = context.transformations[transformationName];

  if(!transformation) {
    throw new YError('E_BAD_TRANSFORMATION', transformationName, transformation);
  }

  return transformation(path, values);
}

function visitObjectPattern(context, path) {
  const node = path.node;

  node.properties = node.properties.reduce((properties, propertyNode) => {
    if(
      (!namedTypes.Property.check(propertyNode)) ||
      (!namedTypes.Identifier.check(propertyNode.key)) ||
      !propertyNode.key.name.startsWith(LOOP_PREFIX)
    ) {
      return properties.concat(propertyNode);
    }
    debug(
      'Found a loop in an ObjectPattern "' + propertyNode.key.name + '"' +
      printLine(propertyNode.loc)
    );

    return properties.concat(processObjectPatternLoop(context, propertyNode));
  }, []);

  this.traverse(path);
}

function processObjectPatternLoop(context, propertyNode) {
  const {
    itemsProperty,
    itemsFilters,
    itemNameProperty,
    itemNameFilters,
  } = chunkLoopExpression(propertyNode.key.name);
  const items = miniquery(itemsProperty, context.valuesStack);

  debug('Found ' + items.length + ' matchs for it.');

  return applyFilters(context, itemsFilters, items).map((item) => {
    const newNode = deepClone(propertyNode);
    const name = itemNameProperty ? miniquery(itemNameProperty, [item])[0] : item;

    if(!name) {
      throw new YError('E_NO_NAME', itemsProperty);
    }
    newNode.key.name = applyFilters(context, itemNameFilters, name);
    context.valuesStack.push(item);
    types.visit(newNode, createVisitor(context));
    context.valuesStack.pop();
    return newNode;
  });
}

function visitObjectExpression(context, path) {
  const node = path.node;

  node.properties = node.properties.reduce((properties, propertyNode) => {
    if(
      (!namedTypes.Property.check(propertyNode)) ||
      (!namedTypes.Identifier.check(propertyNode.key)) ||
      !propertyNode.key.name.startsWith(LOOP_PREFIX)
    ) {
      return properties.concat(propertyNode);
    }
    debug(
      'Found a loop in an ObjectExpression "' + propertyNode.key.name + '"' +
      printLine(propertyNode.loc)
    );

    return properties.concat(processObjectExpressionLoop(context, propertyNode));
  }, []);

  this.traverse(path);
}

function processObjectExpressionLoop(context, propertyNode) {
  const {
    itemsProperty,
    itemsFilters,
    itemNameProperty,
    itemNameFilters,
  } = chunkLoopExpression(propertyNode.key.name);
  const items = miniquery(itemsProperty, context.valuesStack);

  debug('Found ' + items.length + ' matchs for it.');

  return applyFilters(context, itemsFilters, items).map((item) => {
    const newNode = deepClone(propertyNode);
    const name = itemNameProperty ? miniquery(itemNameProperty, [item])[0] : item;

    if(!name) {
      throw new YError('E_NO_NAME', itemsProperty, itemNameProperty);
    }
    newNode.key.name = applyFilters(context, itemNameFilters, name);
    context.valuesStack.push(item);
    types.visit(newNode, createVisitor(context));
    context.valuesStack.pop();
    return newNode;
  });
}

function visitBlockStatement(context, path) {
  const node = path.node;

  node.body = node.body.reduce((body, bodyNode) => {
    if(
      (!namedTypes.FunctionDeclaration.check(bodyNode)) ||
      (!namedTypes.Identifier.check(bodyNode.id)) ||
      !bodyNode.id.name.startsWith(LOOP_PREFIX)
    ) {
      return body.concat(bodyNode);
    }
    debug(
      'Found repeated FunctionDeclaration "' + bodyNode.id.name + '"' +
      printLine(bodyNode.loc)
    );

    return body.concat(processFunctionDeclarationLoop.call(this, context, bodyNode, path));
  }, []);

  this.traverse(path);
}

function processFunctionDeclarationLoop(context, bodyNode, path) {
  const {
    itemsProperty,
    itemsFilters,
    itemNameProperty,
    itemNameFilters,
  } = chunkLoopExpression(bodyNode.id.name);
  const items = miniquery(itemsProperty, context.valuesStack);

  debug('Found ' + items.length + ' matchs for it.');

  return applyFilters(context, itemsFilters, items).map((item) => {
    const newNode = deepClone(bodyNode);
    const name = itemNameProperty ? miniquery(itemNameProperty, [item])[0] : item;

    if(!name) {
      throw new YError('E_NO_NAME', itemsProperty, itemNameProperty);
    }
    newNode.id.name = applyFilters(context, itemNameFilters, name);
    context.valuesStack.push(item);
    types.visit(newNode, createVisitor(context));
    context.valuesStack.pop();

    return newNode;
  });
}

function chunkLoopExpression(expression) {
  const [
    mixedItemsProperty,
    mixedItemNameProperty,
  ] = expression.substr(LOOP_PREFIX.length).split(LOOP_SEPARATOR);
  const [
    encodedItemsProperty,
    ...itemsFilters
  ] = mixedItemsProperty.split(FILTERS_SEPARATOR);
  const [
    encodedItemNameProperty,
    ...itemNameFilters
  ] = mixedItemNameProperty.split(FILTERS_SEPARATOR);

  return {
    itemsProperty: translatePath(encodedItemsProperty),
    itemsFilters,
    itemNameProperty: translatePath(encodedItemNameProperty),
    itemNameFilters,
  };
}

function translatePath(encodedPath) {
  return encodedPath.replace(PATH_SEPARATOR, '.').replace(ENCODED_WILCARD, '*')
    .replace(ENCODED_HASH, '#')
    .replace(ENCODED_AROBASE, '@');
}

function printLine(loc) {
  if(!loc) {
    return '.';
  }
  return ' at line ' + loc.start.line + ':' + loc.start.column + '.';
}

function applyFilters({ filters }, filterNames, value) {
  return filterNames.reduce((value, filterName) => {
    if(!filters[filterName]) {
      throw new YError('E_BAD_FILTER', filterName);
    }
    try {
      return filters[filterName](value);
    } catch (err) {
      throw YError.wrap(err, 'E_FILTER_FAIL', filterName);
    }
  }, value);
}
