/**
 * Parse comma-separated string, and returns array of values.
 * Accepted types of values are string or number.
 * @param csvString comma-separated string
 * @returns         Array of values
 */
export function parseCSV(csvString: string): Array<string | number> {
    // return empty array for empty string
    if (!csvString.trim())
        return [];

    let params: string[] = csvString.trim().split(',');
    let ret: Array<string | number> = [];

    for (let param of params) {
        let parsed = parseFloat(param);
        // If param is string, then parsed is NaN
        if (isNaN(parsed)) {
            let str = param.trim();   // string parameter
            if (str) ret.push(str);   // string is not empty
            else ret.push(undefined); // string is empty
        }
        // If parsed is not NaN, it is number
        else
            ret.push(parsed);   // number parameter
    }

    return ret;
}

/**
 * Make comma-separated string from array.
 * @param values  Array of values
 * @returns       comma-separated string
 */
export function mkString(values: Array<string | number>): string {
    let csvString = '';

    for (let val of values) {
        if (typeof val === 'string')
            csvString += ',' + val.trim();
        else if (typeof val === 'number')
            csvString += ',' + val.toString();
        // Ignore other types
    }

    // Remove first comma (e.g. if csvString = ',1,two', then '1,two')
    // If csvString is empty string, then it is still empty string
    csvString = csvString.slice(1, csvString.length);

    return csvString;
}
