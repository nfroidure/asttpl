/* eslint max-len:0 */

'use strict';

const assert = require('assert');
const asttpl = require('.');
const { builders } = require('ast-types');

const transformations = {
  buildPath,
  buildData,
  takeToken,
  buildQueryParameters,
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

function takeToken(path, values) {
  const node = path.node;
  const apiToken = (values[values.length - 1] || [])
  .filter(parameter => 'header' === parameter.in)
  .find(parameter => 'Authorization' === parameter.name);

  if(apiToken) {
    node.name = apiToken.name;
    return;
  }
  path.prune();
  return false; // eslint-disable-line
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
    𐅙repeat𐅙parameters𐅞𐅅𐅙name
  }, options = {}) {
    const urlParts = [ENV.apiEndpoint].concat(𐅙transform𐅙buildPath𐅙path);
    const query = 𐅙transform𐅙buildQueryParameters𐅙parameters;
    const headers = {};
    let data = 𐅙transform𐅙buildData𐅙parameters;
    let apiToken = 𐅙transform𐅙takeToken𐅙parameters;
    let qs = querystring.stringify(cleanQuery(query));

    if (apiToken) {
      headers['Authorization'] = 'Bearer ' + apiToken;
    }

    if (data) {
      headers['Content-Type'] = 'application/json';
    }

    const req = Object.assign(options, {
      method: HTTP_METHODS.𐅙variable𐅙method,
      url: urlParts.join('') + (qs.length ? '?' + qs : ''),
      headers,
      data
    });
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
      token,
      access_token,
      Authorization,
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

    const headers = {};
    let data;
    let apiToken = Authorization;
    let qs = querystring.stringify(cleanQuery(query));

    if (apiToken) {
      headers['Authorization'] = 'Bearer ' + apiToken;
    }

    if (data) {
      headers['Content-Type'] = 'application/json';
    }

    const req = Object.assign(options, {
      method: HTTP_METHODS.get,
      url: urlParts.join('') + ((qs.length ? '?' + qs : '')),
      headers,
      data
    });

    return $http(req);
  }

  function putArticle(
    {
      token,
      access_token,
      body,
      Authorization,
      articleId
    },
    options = {}
  ) {
    const urlParts = [ENV.apiEndpoint].concat(['/articles/', articleId, '']);

    const query = {
      token,
      access_token
    };

    const headers = {};
    let data = body;
    let apiToken = Authorization;
    let qs = querystring.stringify(cleanQuery(query));

    if (apiToken) {
      headers['Authorization'] = 'Bearer ' + apiToken;
    }

    if (data) {
      headers['Content-Type'] = 'application/json';
    }

    const req = Object.assign(options, {
      method: HTTP_METHODS.get,
      url: urlParts.join('') + ((qs.length ? '?' + qs : '')),
      headers,
      data
    });

    return $http(req);
  }
}`;

describe('astpl', () => {
  it('with a real template but no values', () => {
    assert.equal(
      asttpl({ transformations }, template, []),
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
      asttpl({ transformations }, template, [{ endpoints }]),
      expectedFull
    );
  });
});
