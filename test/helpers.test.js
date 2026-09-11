// Pure unit tests (no database)
const mongoose = require('mongoose');
const fnHelperFactory = require('../src/helpers/functions');

const Dummy = mongoose.model('DummyHelperModel', new mongoose.Schema({ name: String, nested: { a: Number } }), 'dummy_helper');
const fnHelper = fnHelperFactory({ models: [{ slug: 'dummy', model: Dummy }] });

describe('helpers/functions', () => {
  it('escapeRegExp escapes every special character', () => {
    expect(fnHelper.escapeRegExp('a.b*c+d?e^f$g{h}i(j)k|l[m]n\\o')).toBe('a\\.b\\*c\\+d\\?e\\^f\\$g\\{h\\}i\\(j\\)k\\|l\\[m\\]n\\\\o');
    expect(new RegExp(fnHelper.escapeRegExp('(a+)+$')).test('x(a+)+$y')).toBe(true);
  });

  it('isValidFieldPath whitelists schema paths (nested included)', () => {
    expect(fnHelper.isValidFieldPath(Dummy, 'name')).toBe(true);
    expect(fnHelper.isValidFieldPath(Dummy, 'nested.a')).toBe(true);
    expect(fnHelper.isValidFieldPath(Dummy, '_id')).toBe(true);
    expect(fnHelper.isValidFieldPath(Dummy, 'password')).toBe(false);
    expect(fnHelper.isValidFieldPath(Dummy, '$where')).toBe(false);
    expect(fnHelper.isValidFieldPath(Dummy, '__v')).toBe(false);
    expect(fnHelper.isValidFieldPath(Dummy, null)).toBe(false);
  });

  it('validateOrderStructure validates direction and (optionally) field', () => {
    expect(fnHelper.validateOrderStructure([['name', 'ASC']])).toBe(true);
    expect(fnHelper.validateOrderStructure([['name', 'desc']])).toBe(true);
    expect(fnHelper.validateOrderStructure([['name', 'SIDEWAYS']])).toBe(false);
    expect(fnHelper.validateOrderStructure([['name']])).toBe(false);
    expect(fnHelper.validateOrderStructure('name')).toBe(false);
    expect(fnHelper.validateOrderStructure([])).toBe(false);
    expect(fnHelper.validateOrderStructure([['name', 'ASC']], Dummy)).toBe(true);
    expect(fnHelper.validateOrderStructure([['password', 'ASC']], Dummy)).toBe(false);
    expect(fnHelper.getCleanOrderStructure([['name', 'ASC']])).toEqual({ name: 'asc' });
  });

  it('permutations are bounded in constructSearch', () => {
    expect(fnHelper.permutations(['a', 'b', 'c']).length).toBe(6);
    const small = fnHelper.constructSearch('a b c d', ['x', 'y']);
    const expr = small.$or.find(c => c.$expr);
    expect(expr.$expr.$regexMatch.regex.source.split('|').length).toBe(24);

    const big = fnHelper.constructSearch('a b c d e f g h', ['x', 'y']);
    const bigExpr = big.$or.find(c => c.$expr);
    expect(bigExpr.$expr.$regexMatch.regex.source.split('|').length).toBe(1);
  });

  it('constructSearch escapes the search term', () => {
    const params = fnHelper.constructSearch('(a+)+$', ['x']);
    expect(params.$or[0].x.$regex).toBe('\\(a\\+\\)\\+\\$');
  });

  it('query rules escape regex values', () => {
    const q = fnHelper.constructQuery({ operator: 'and', list: [{ field: 'name', operator: 'contains', value: 'a.b' }] });
    expect(q.$and[0].name.$regex.source).toBe('a\\.b');
    const nc = fnHelper.constructQuery({ operator: 'and', list: [{ field: 'name', operator: 'not_contains', value: '.*' }] });
    expect(nc.$and[0].name.$regex.source).toBe('^((?!\\.\\*).)*$');
  });

  it('buildError does not leak stack traces', () => {
    const err = new Error('boom');
    const built = fnHelper.buildError(err, 'default');
    expect(built.error_details[0].message).toBe('boom');
    expect(JSON.stringify(built)).not.toMatch(/at .*functions/);
  });
});
