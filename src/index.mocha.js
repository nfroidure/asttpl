const os = require('os');
const assert = require('assert');
const sinon = require('sinon');
const asttpl = require('.');

describe('astpl', () => {
  describe('𐅙variable𐅙${path}𐅂filter1𐅂...filterN', () => {
    it('should change a variable assignation name', () => {
      assert.equal(
        asttpl({}, 'const 𐅙variable𐅙testProp = \'test\';', [{
          testProp: 'testValue',
        }]),
        'const testValue = \'test\';'
      );
    });

    it('should change a variable assignation value name', () => {
      assert.equal(
        asttpl({}, 'const lol = 𐅙variable𐅙testProp;', [{
          testProp: 'testValue',
        }]),
        'const lol = testValue;'
      );
    });

    it('should change a variable reference name', () => {
      assert.equal(
        asttpl({}, '𐅙variable𐅙testProp;', [{
          testProp: 'testValue',
        }]),
        'testValue;'
      );
    });

    it('should change a property name', () => {
      assert.equal(
        asttpl({}, 'var x = { 𐅙variable𐅙testProp: \'\' };', [{
          testProp: 'testValue',
        }]),
        'var x = {' + os.EOL +
        '  testValue: \'\'' + os.EOL +
        '};'
      );
    });

    it('should change a property value', () => {
      assert.equal(
        asttpl({}, 'var x = { lol: 𐅙variable𐅙testProp };', [{
          testProp: 'testValue',
        }]),
        'var x = {' + os.EOL +
        '  lol: testValue' + os.EOL +
        '};'
      );
    });

    it('should change a function name', () => {
      assert.equal(
        asttpl({}, 'function 𐅙variable𐅙testProp() {}', [{
          testProp: 'testValue',
        }]),
        'function testValue() {}'
      );
    });

    it('should work with a path', () => {
      assert.equal(
        asttpl({
          filters: {
            firstToUpper: a => a[0].toUpperCase() + a.substr(1),
          },
        }, 'function 𐅙variable𐅙testProp𐅞testSubProp𐅂firstToUpper() {}', [{
          testProp: { testSubProp: 'testValue' },
        }]),
        'function TestValue() {}'
      );
    });

    it('should work with one filter', () => {
      assert.equal(
        asttpl({
          filters: {
            firstToUpper: a => a[0].toUpperCase() + a.substr(1),
          },
        }, 'function 𐅙variable𐅙testProp𐅂firstToUpper() {}', [{
          testProp: 'testValue',
        }]),
        'function TestValue() {}'
      );
    });

    it('should work with several filters', () => {
      assert.equal(
        asttpl({
          filters: {
            prefix: a => 'hey' + a,
            firstToUpper: a => a[0].toUpperCase() + a.substr(1),
          },
        }, 'function 𐅙variable𐅙testProp𐅂firstToUpper𐅂prefix() {}', [{
          testProp: 'testValue',
        }]),
        'function heyTestValue() {}'
      );
    });

    it('should work with several path nodes', () => {
      assert.equal(
        asttpl({}, 'function 𐅙variable𐅙testProp𐅞testProp2𐅞testProp3() {}', [{
          testProp: { testProp2: { testProp3: 'testValue' } },
        }]),
        'function testValue() {}'
      );
    });

    it('should fail when no value is found', () => {
      assert.throws(() => {
        asttpl({}, 'const 𐅙variable𐅙testProp = \'test\';', []);
      }, /E_NO_NAME/);
    });
  });

  describe('𐅙literal𐅙${path}𐅂filter1𐅂...filterN', () => {
    it('should replace an assignation by a literal value', () => {
      assert.equal(
        asttpl({}, 'const val = 𐅙literal𐅙testProp;', [{
          testProp: 'testValue',
        }]),
        'const val = \'testValue\';'
      );
    });

    it('should replace a property value by a literal value', () => {
      assert.equal(
        asttpl({}, '{ plop: 𐅙literal𐅙testProp }', [{
          testProp: 'testValue',
        }]),
        '{' + os.EOL +
        '  plop:' + os.EOL +
        '  \'testValue\'' + os.EOL +
        '}'
      );
    });

    it('should fallback to undefined when no value', () => {
      assert.equal(
        asttpl({}, 'const val = 𐅙literal𐅙testProp;', []),
        'const val = {}.undef;'
      );
    });

    it('should work with a path', () => {
      assert.equal(
        asttpl({
          filters: {
            firstToUpper: a => a[0].toUpperCase() + a.substr(1),
          },
        }, 'var a = 𐅙literal𐅙testProp𐅞testSubProp𐅂firstToUpper;', [{
          testProp: { testSubProp: 'testValue' },
        }]),
        'var a = \'TestValue\';'
      );
    });

    it('should work with one filter', () => {
      assert.equal(
        asttpl({
          filters: {
            firstToUpper: a => a[0].toUpperCase() + a.substr(1),
          },
        }, 'var a = 𐅙literal𐅙testProp𐅂firstToUpper;', [{
          testProp: 'testValue',
        }]),
        'var a = \'TestValue\';'
      );
    });

    it('should work with several filters', () => {
      assert.equal(
        asttpl({
          filters: {
            prefix: a => 'hey' + a,
            firstToUpper: a => a[0].toUpperCase() + a.substr(1),
          },
        }, 'var a = 𐅙literal𐅙testProp𐅂firstToUpper𐅂prefix;', [{
          testProp: 'testValue',
        }]),
        'var a = \'heyTestValue\';'
      );
    });

    it('should fail when trying to change a variable name', () => {
      assert.throws(() => {
        asttpl({}, 'val.𐅙literal𐅙testProp;', [{
          testProp: 'testValue',
        }]);
      }, /E_BAD_LITERAL/);
    });

    it('should fail when trying to change a variable name', () => {
      assert.throws(() => {
        asttpl({}, 'const { 𐅙literal𐅙testProp } = xxx;', [{
          testProp: 'testValue',
        }]);
      }, /E_BAD_LITERAL/);
    });

    it('should fail when trying to change a variable name', () => {
      assert.throws(() => {
        asttpl({}, 'const 𐅙literal𐅙testProp = \'test\';', [{
          testProp: 'testValue',
        }]);
      }, /E_BAD_LITERAL/);
    });

    it('should fail when trying to change a function name', () => {
      assert.throws(() => {
        asttpl({}, 'function 𐅙literal𐅙testProp() {}', [{
          testProp: 'testValue',
        }]);
      }, /E_BAD_LITERAL/);
    });
  });

  describe('𐅙transform𐅙${transformationName}𐅙${path}', () => {
    const transformations = {
      upper: (path, values) => {
        const node = path.node;
        node.name = values[values.length - 1].toUpperCase();
        path.replace(node);
      },
      lower: (path, values) => {
        const node = path.node;
        node.name = values[values.length - 1].toLowerCase();
        path.replace(node);
      },
    };
    let upperSpy;
    let lowerSpy;

    beforeEach(() => {
      upperSpy = sinon.spy(transformations, 'upper');
      lowerSpy = sinon.spy(transformations, 'lower');
    });

    afterEach(() => {
      upperSpy.restore();
      lowerSpy.restore();
    });

    it('should execute transformations on identifiers', () => {
      assert.equal(
        asttpl({ transformations }, 'let 𐅙transform𐅙upper𐅙testProp;', [{
          testProp: 'testValue',
        }]),
        'let TESTVALUE;'
      );
      assert.equal(upperSpy.callCount, 1);
      assert.equal(lowerSpy.callCount, 0);
    });

    it('should execute transformations on functions names', () => {
      assert.equal(
        asttpl({ transformations }, 'function 𐅙transform𐅙lower𐅙testProp () {}', [{
          testProp: 'testValue',
        }]),
        'function testvalue() {}'
      );
      assert.equal(upperSpy.callCount, 0);
      assert.equal(lowerSpy.callCount, 1);
    });

    it('should fail with undeclared transformations', () => {
      assert.throws(() => {
        asttpl({}, 'let 𐅙transform𐅙upper𐅙testProp;', [{
          testProp: 'testValue',
        }]);
      }, /E_BAD_TRANSFORMATION/);
    });
  });

  describe('𐅙repeat𐅙${entriesPath}𐅙${namePath}', () => {
    it('should repeat properties in an assignation', () => {
      assert.equal(
        asttpl({}, 'const val = { 𐅙repeat𐅙testProps𐅞𐅅𐅙name };', [{
          testProps: [{ name: 'testValue1' }, { name: 'testValue2' }],
        }]),
        'const val = {' + os.EOL +
        '  testValue1,' + os.EOL +
        '  testValue2' + os.EOL +
        '};'
      );
    });

    it('should repeat properties in an assignation', () => {
      assert.equal(
        asttpl({}, 'const val = { 𐅙repeat𐅙testProps𐅞𐅅𐅙name: 𐅙literal𐅙name };', [{
          testProps: [{ name: 'testValue1' }, { name: 'testValue2' }],
        }]),
        'const val = {' + os.EOL +
        '  testValue1: \'testValue1\',' + os.EOL +
        '  testValue2: \'testValue2\'' + os.EOL +
        '};'
      );
    });

    it('should repeat properties in object patterns', () => {
      assert.equal(
        asttpl({}, 'function val ({ 𐅙repeat𐅙testProps𐅞𐅅𐅙name }) {}', [{
          testProps: [{
            name: 'testValue1',
          }, {
            name: 'testValue2',
          }],
        }]),
        'function val(' + os.EOL +
        '  {' + os.EOL +
        '    testValue1,' + os.EOL +
        '    testValue2' + os.EOL +
        '  }' + os.EOL +
        ') {}'
      );
    });

    it('should repeat mapped properties in object patterns', () => {
      assert.equal(
        asttpl({}, 'function val ({ 𐅙repeat𐅙testProps𐅞𐅅𐅙to: 𐅙variable𐅙from }) {}', [{
          testProps: [{
            from: 'fromValue1',
            to: 'toValue1',
          }, {
            from: 'fromValue2',
            to: 'toValue2',
          }],
        }]),
        'function val(' + os.EOL +
        '  {' + os.EOL +
        '    toValue1: fromValue1,' + os.EOL +
        '    toValue2: fromValue2' + os.EOL +
        '  }' + os.EOL +
        ') {}'
      );
    });

    it('should repeat functions declarations in a program', () => {
      assert.equal(
        asttpl({}, 'function 𐅙repeat𐅙testProps𐅞𐅅𐅙name() { return 𐅙literal𐅙name; }', [{
          testProps: [{ name: 'testValue1' }, { name: 'testValue2' }],
        }]),
        'function testValue1() {' + os.EOL +
        '  return \'testValue1\';' + os.EOL +
        '}' + os.EOL +
        '' + os.EOL +
        'function testValue2() {' + os.EOL +
        '  return \'testValue2\';' + os.EOL +
        '}'
      );
    });

    it('should repeat functions declarations in a block', () => {
      assert.equal(
        asttpl({}, '{ function 𐅙repeat𐅙testProps𐅞𐅅𐅙name() { return 𐅙literal𐅙name; } }', [{
          testProps: [{ name: 'testValue1' }, { name: 'testValue2' }],
        }]),
        '{' + os.EOL +
        '  function testValue1() {' + os.EOL +
        '    return \'testValue1\';' + os.EOL +
        '  }' + os.EOL +
        '' + os.EOL +
        '  function testValue2() {' + os.EOL +
        '    return \'testValue2\';' + os.EOL +
        '  }' + os.EOL +
        '}'
      );
    });
  });
});
