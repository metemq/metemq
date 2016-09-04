import { assert } from 'meteor/practicalmeteor:chai';
import { parseJSON, stringifyJSON } from '../../../server/ddmq/util';

describe('module DDMQ Util', function() {

    describe('#parseJSONArray(jsonArrayString)', function() {

        it('should parse strings', function() {
            let input = '["one","two","three"]';
            let output = parseJSON(input);

            assert.deepEqual(output, ['one', 'two', 'three']);
        });

        it('should parse integers', function() {
            let input = '[1,2,3]';
            let output = parseJSON(input);

            assert.deepEqual(output, [1, 2, 3]);
        });

        it('should parse negative numbers', function() {
            let input = '[1,-2,-3.456]';
            let output = parseJSON(input);

            assert.deepEqual(output, [1, -2, -3.456]);
        });

        it('should parse floats', function() {
            let input = '[1.234,0.0123,123.000]';
            let output = parseJSON(input);

            assert.deepEqual(output, [1.234, 0.0123, 123.000]);
        });

        it('should allow spaces', function() {
            let input = '["one", "two", 3, 4.123]';
            let output = parseJSON(input);

            assert.deepEqual(output, ['one', 'two', 3, 4.123]);
        });

        it('should parse null', function() {
            let input = '[1.234,null,"three",4]';
            let output = parseJSON(input);

            assert.deepEqual(output, [1.234, null, 'three', 4]);
        });

        it('should return undefined when payload is empty string', function() {
            let input = '';
            let output = parseJSON(input);

            assert.isUndefined(output);
        });

        it('should parse an array inside array', function() {
            let input = '["a", 1, ["b", 4], null]';
            let output = parseJSON(input);

            assert.isArray(output);
            assert.deepEqual(output, ['a', 1, ['b', 4], null]);
        });

        it('should check type of elements of array', function() {
            /* TODO */
        });
    });

    describe('#mkString(arr)', function() {

        it('should convert a string array to JSON string', function() {
            let input = ['one', 'two', 'three'];
            let output = stringifyJSON(input);

            assert.equal(output, '["one","two","three"]');
        });

        it('should convert a number array to JSON string', function() {
            let input = [1, 2, 3];
            let output = stringifyJSON(input);

            assert.equal(output, '[1,2,3]');
        });


        it('should convert a mixed array to JSON string', function() {
            let input = [1, 'two', 3.456];
            let output = stringifyJSON(input);

            assert.equal(output, '[1,"two",3.456]');
        });

        it('should convert an undefined or null element to null', function() {
            assert.equal(stringifyJSON([1, 'two', null]), '[1,"two",null]');
            assert.equal(stringifyJSON([undefined, 'two', 3.456]), '[null,"two",3.456]');
            assert.equal(stringifyJSON(['one', undefined, 3]), '["one",null,3]');
            assert.equal(stringifyJSON([1, undefined, null]), '[1,null,null]');
            assert.equal(stringifyJSON([undefined, null, undefined]), '[null,null,null]');
        });

        it('should convert a number to JSON array', function() {
            let input = 1234;
            let output = stringifyJSON(input);

            assert.equal(output, '1234');
        });

        it('should convert a string to JSON array', function() {
            let input = 'abcd';
            let output = stringifyJSON(input);

            assert.equal(output, '"abcd"');
        });
    });
});
