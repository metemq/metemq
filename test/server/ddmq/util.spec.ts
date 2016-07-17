import { assert } from 'meteor/practicalmeteor:chai';
import { parseCSV, mkString } from '../../../server/ddmq/util';

describe('module DDMQ Util', function() {

    describe('#parseCSV(csvString)', function() {

        it('should parse comma-separated strings', function() {
            let input = 'one,two,three';
            let output = parseCSV(input);

            assert.deepEqual(output, ['one', 'two', 'three']);
        });

        it('should parse comma-separated integers', function() {
            let input = '1,2,3';
            let output = parseCSV(input);

            assert.deepEqual(output, [1, 2, 3]);
        });

        it('should parse comma-separated negative numbers', function() {
            let input = '1,-2,-3.456';
            let output = parseCSV(input);

            assert.deepEqual(output, [1, -2, -3.456]);
        });

        it('should parse comma-separated floats', function() {
            let input = '1.234,0.0123,123.000';
            let output = parseCSV(input);

            assert.deepEqual(output, [1.234, 0.0123, 123.000]);
        });

        it('should allow spaces', function() {
            let input = 'one, two, 3, 4.123';
            let output = parseCSV(input);

            assert.deepEqual(output, ['one', 'two', 3, 4.123]);
        });

        it('should replace blank with undefined', function() {
            let input = '1.234,,three,4';
            let output = parseCSV(input);

            assert.deepEqual(output, [1.234, undefined, 'three', 4]);
        });

        it('should return empty array when payload is empty string', function() {
            let input = '';
            let output = parseCSV(input);

            assert.isArray(output);
            assert.lengthOf(output, 0);
        });
    });

    describe('#mkString(arr)', function() {

        it('should convert a string array to CSV string', function() {
            let input = ['one', 'two', 'three'];
            let output = mkString(input);

            assert.equal(output, 'one,two,three');
        });

        it('should convert a number array to CSV string', function() {
            let input = [1, 2, 3];
            let output = mkString(input);

            assert.equal(output, '1,2,3');
        });


        it('should convert a mixed array to CSV string', function() {
            let input = [1, 'two', 3.456];
            let output = mkString(input);

            assert.equal(output, '1,two,3.456');
        });

        it('should convert an undefined element to blank', function() {
            assert.equal(mkString([1, 'two', undefined]), '1,two,');
            assert.equal(mkString([undefined, 'two', 3.456]), ',two,3.456');
            assert.equal(mkString(['one', undefined, 3]), 'one,,3');
            assert.equal(mkString([1, undefined, undefined]), '1,,');
            assert.equal(mkString([undefined, null, undefined]), ',,');
        });
    });
});
