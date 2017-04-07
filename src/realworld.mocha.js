/* eslint max-len:0 */

'use strict';

const assert = require('assert');
const camelCase = require('camel-case');
const headerCase = require('header-case');
const asttpl = require('.');
const { builders } = require('ast-types');

const transformations = {
  buildPath,
  buildData,
  buildQueryParameters,
  buildHeadersParameters,
  isDirectFileUpload,
};

const filters = {
  inHeaders:
    a =>
      a.filter(p => 'header' === p.in)
      .map((p) => { p.name = camelCase(p.name); return p; }),
  notInHeaders: a => a.filter(p => 'header' !== p.in),
};

function buildPath(path, values) {
  const parameters = [];
  const parts = values[0].replace(/{([a-z0-9]+)}/ig, ($, $1) => {
    parameters.push($1);
    return '|';
  }).split('|');

  path.replace(builders.arrayExpression(
    parts.reduce((elements, part, index) => {
      elements = elements.concat(builders.literal(part));
      if(parameters[index]) {
        elements = elements.concat(builders.identifier(parameters[index]));
      }
      return elements;
    }, [])
  ));
}

function buildData(path, values) {
  const node = path.node;
  const body = (values[values.length - 1] || []).find(parameter => 'body' === parameter.in);

  if(body) {
    node.name = body.name;
    return;
  }
  path.prune();
  return false; // eslint-disable-line
}

function isDirectFileUpload(path, values) {
  const node = path.node;
  const body = (values[values.length - 1] || [])
  .find(parameter => 'body' === parameter.in);

  // Trick to mock direct file upload since Swagger spec
  // has no way to describe it currently
  if(
    body.schema &&
    'string' === body.schema.type &&
    'binary' === body.schema.format
  ) {
    node.name = body.name;
    path.replace(builders.literal(true));
    return;
  }
  path.replace(builders.literal(false));
}

function buildQueryParameters(path, values) {
  path.replace({
    type: 'ObjectExpression',
    properties: values[values.length - 1]
    .filter(param => 'query' === param.in)
    .map(param => ({
      type: 'Property',
      key: {
        type: 'Identifier',
        name: param.name,
      },
      computed: false,
      value: {
        type: 'Identifier',
        name: param.name,
        loc: null,
      },
      kind: 'init',
      method: false,
      shorthand: true,
    })),
  });
}

function buildHeadersParameters(path, values) {
  path.replace({
    type: 'ObjectExpression',
    properties: values[values.length - 1]
    .filter(param => 'header' === param.in)
    .map(param => ({
      type: 'Property',
      key: {
        type: 'Identifier',
        name: headerCase(param.name),
      },
      computed: false,
      value: {
        type: 'Identifier',
        name: camelCase(param.name),
        loc: null,
      },
      kind: 'init',
      method: false,
      shorthand: false,
    })),
  });
}

const template =
`import querystring from 'querystring';
import angular from 'angular';

const HTTP_METHODS = {
  options: 'OPTIONS',
  head: 'HEAD',
  get: 'GET',
  post: 'POST',
  put: 'PUT',
  patch: 'PATCH',
  delete: 'DELETE'
};

const sortFn = (a, b) => a > b ? 1 : -1;
const cleanQuery = (query) => {
  return Object.keys(query)
    .filter((key) => typeof query[key] !== 'undefined')
    .filter((key) => (!(query[key] instanceof Array)) || query[key].length !== 0)
    .reduce((newQuery, key) => {
      newQuery[key] = query[key];
      return newQuery;
    }, {});
};

angular.module('app').factory('API', apiService);

apiService.$inject = ['ENV', '$http'];

function apiService(ENV, $http) {
  const API = {
    𐅙repeat𐅙endpoints𐅞𐅅𐅙operationId
  };

  return API;

  function 𐅙repeat𐅙endpoints𐅞𐅅𐅙operationId ({
    𐅙repeat𐅙parameters𐅞𐅅𐅂inHeaders𐅙name,
    𐅙repeat𐅙parameters𐅞𐅅𐅂notInHeaders𐅙name
  }, options = {}) {
    const urlParts = [ENV.apiEndpoint].concat(𐅙transform𐅙buildPath𐅙path);
    const query = 𐅙transform𐅙buildQueryParameters𐅙parameters;
    const headers = 𐅙transform𐅙buildHeadersParameters𐅙parameters;

    let data = 𐅙transform𐅙buildData𐅙parameters;
    let qs = querystring.stringify(cleanQuery(query));

    if ((typeof contentType === 'undefined' || !contentType) && data) {
      headers['Content-Type'] = 'application/json';
    }

    const req = Object.assign(options, {
      method: HTTP_METHODS.𐅙variable𐅙method,
      url: urlParts.join('') + (qs.length ? '?' + qs : ''),
      headers,
      data
    });

    if (data instanceof Blob) {
      req.transformRequest = [];
    }

    return $http(req);
  }
}`;

const expected =
`import querystring from 'querystring';
import angular from 'angular';

const HTTP_METHODS = {
  options: 'OPTIONS',
  head: 'HEAD',
  get: 'GET',
  post: 'POST',
  put: 'PUT',
  patch: 'PATCH',
  delete: 'DELETE'
};

const sortFn = (a, b) => (a > b ? 1 : -1);

const cleanQuery = query => {
  return Object.keys(query).filter(key => typeof query[key] !== 'undefined').filter(key => !(query[key] instanceof Array) || query[key].length !== 0).reduce((newQuery, key) => {
    newQuery[key] = query[key];
    return newQuery;
  }, {});
};

angular.module('app').factory('API', apiService);
apiService.$inject = ['ENV', '$http'];

function apiService(ENV, $http) {
  const API = {};
  return API;
}`;

const expectedFull =
`import querystring from 'querystring';
import angular from 'angular';

const HTTP_METHODS = {
  options: 'OPTIONS',
  head: 'HEAD',
  get: 'GET',
  post: 'POST',
  put: 'PUT',
  patch: 'PATCH',
  delete: 'DELETE'
};

const sortFn = (a, b) => (a > b ? 1 : -1);

const cleanQuery = query => {
  return Object.keys(query).filter(key => typeof query[key] !== 'undefined').filter(key => !(query[key] instanceof Array) || query[key].length !== 0).reduce((newQuery, key) => {
    newQuery[key] = query[key];
    return newQuery;
  }, {});
};

angular.module('app').factory('API', apiService);
apiService.$inject = ['ENV', '$http'];

function apiService(ENV, $http) {
  const API = {
    getAlbums,
    putArticle
  };

  return API;

  function getAlbums(
    {
      authorization,
      token,
      access_token,
      limit,
      offset,
      territory,
      term
    },
    options = {}
  ) {
    const urlParts = [ENV.apiEndpoint].concat(['/search/albums']);

    const query = {
      token,
      access_token,
      limit,
      offset,
      territory,
      term
    };

    const headers = {
      Authorization: authorization
    };

    let data;
    let qs = querystring.stringify(cleanQuery(query));

    if ((typeof contentType === 'undefined' || !contentType) && data) {
      headers['Content-Type'] = 'application/json';
    }

    const req = Object.assign(options, {
      method: HTTP_METHODS.get,
      url: urlParts.join('') + ((qs.length ? '?' + qs : '')),
      headers,
      data
    });

    if (data instanceof Blob) {
      req.transformRequest = [];
    }

    return $http(req);
  }

  function putArticle(
    {
      authorization,
      token,
      access_token,
      body,
      articleId
    },
    options = {}
  ) {
    const urlParts = [ENV.apiEndpoint].concat(['/articles/', articleId, '']);

    const query = {
      token,
      access_token
    };

    const headers = {
      Authorization: authorization
    };

    let data = body;
    let qs = querystring.stringify(cleanQuery(query));

    if ((typeof contentType === 'undefined' || !contentType) && data) {
      headers['Content-Type'] = 'application/json';
    }

    const req = Object.assign(options, {
      method: HTTP_METHODS.get,
      url: urlParts.join('') + ((qs.length ? '?' + qs : '')),
      headers,
      data
    });

    if (data instanceof Blob) {
      req.transformRequest = [];
    }

    return $http(req);
  }
}`;

describe('astpl', () => {
  it('with a real template but no values', () => {
    assert.equal(
      asttpl({ transformations, filters }, template, []),
      expected
    );
  });

  it('with a full realistic example', () => {
    const endpoints = [{
      method: 'get',
      path: '/search/albums',
      tags: [
        'albums',
      ],
      description: 'Returns albums containing a given term.',
      operationId: 'getAlbums',
      consumes: [],
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'token',
          description: 'Deprecated way to set the token',
          type: 'string',
          in: 'query',
        },
        {
          name: 'access_token',
          description: 'Brand new way to set the token in the query string (standard too)',
          type: 'string',
          in: 'query',
        },
        {
          in: 'header',
          name: 'Authorization',
          description: 'Bearer authorization header',
        },
        {
          name: 'limit',
          type: 'number',
          required: false,
          in: 'query',
        },
        {
          name: 'offset',
          type: 'number',
          required: false,
          in: 'query',
        },
        {
          name: 'territory',
          type: 'string',
          required: false,
          in: 'query',
        },
        {
          name: 'term',
          type: 'string',
          required: false,
          in: 'query',
        },
      ],
    }, {
      method: 'get',
      path: '/articles/{articleId}',
      tags: [
        'articles',
      ],
      deprecated: false,
      description: 'Update an article.',
      operationId: 'putArticle',
      consumes: [
        'application/json',
      ],
      produces: [
        'application/json',
      ],
      parameters: [
        {
          name: 'token',
          description: 'Deprecated way to set the token',
          type: 'string',
          in: 'query',
        },
        {
          name: 'access_token',
          description: 'Brand new way to set the token in the query string (standard too)',
          type: 'string',
          in: 'query',
        },
        {
          in: 'body',
          name: 'body',
          schema: {
            title: 'Article',
            type: 'object',
            additionalProperties: false,
          },
          required: true,
        },
        {
          in: 'header',
          name: 'Authorization',
          description: 'Bearer authorization header',
        },
        {
          name: 'articleId',
          type: 'number',
          required: true,
          in: 'path',
        },
      ],
    }];
    assert.equal(
      asttpl({ transformations, filters }, template, [{ endpoints }]),
      expectedFull
    );
  });
});
