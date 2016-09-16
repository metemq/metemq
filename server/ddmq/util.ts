import { _ } from 'meteor/underscore';

/**
 * Parse comma-separated string, and returns array of values.
 * Accepted types of values are string or number.
 * @param csvString comma-separated string
 * @returns         Array of values
 */
export function parseJSON(jsonString: string): undefined | number | string | Array<string | number> {
    // return empty array if string is empty
    if (!jsonString.trim()) return undefined;

    let ret;

    try {
        ret = JSON.parse(jsonString);
    } catch (e) {
        throw new Error(`Cannot parse JSON string! which is ${jsonString}`);
    }

    return ret;

    // function checkArrayType(arr: any[]) {
    //     if (!_.isArray(arr)) return false;
    //     for (let val of arr) {
    //
    //     }
    // }
}

/**
 * Make comma-separated string from array.
 * @param values  Array of values
 * @returns       comma-separated string
 */
export function stringifyJSON(obj: any): string {

    // Return undefined if it does not contain a value
    if (!obj) return undefined;

    let str;

    try {
        str = JSON.stringify(obj);
    } catch (e) {
        throw new Error(`Cannot stringify JSON! which is ${obj}`);
    }

    return str;
}
