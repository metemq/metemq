import { _ } from 'meteor/underscore';
import { Source } from '../source';
import { parseJSON, stringifyJSON } from '../../ddmq/util';
import { CALLACK } from '../../ddmq/ackCodes';

export default function methodCall(payload, params, source: Source) {
    const thingId: string = params.thingId;
    const method: string = params.method;
    const msgId: string = params.msgId;

    //Check the session is existed
    if (!source.hasSession(thingId)) {
        // Send $callack message with NO_SUCH_SESSION error code
        source.send(`${thingId}/$callack/${msgId}/${CALLACK.SESSION_NOT_FOUND}`, '');
        return;
    }

    // Check the method is defined
    if (!_.has(source.methodHandlers, method)) {
        // Send $callack message with NO_SUCH_METHOD error code
        source.send(`${thingId}/$callack/${msgId}/${CALLACK.NO_SUCH_METHOD}`, '');
        return;
    }

    // Configure variables to run method handler
    const methodHandler = source.methodHandlers[method];
    const methodParams = parseJSON(payload);    /* TODO: should check type of methodParams is array*/
    const context = { thingId: thingId };

    let result: undefined | string | number | Array<string | number>;
    let error: Error;

    try {
        // Run method handler in context of the thing
        result = methodHandler.apply(context, methodParams)
    } catch (e) {
        error = e;
    }

    // If there was an exception while running method handler,
    // send METHOD_EXCEPTION to the thing
    if (error) {
        source.send(`${thingId}/$callack/${msgId}/${CALLACK.METHOD_EXCEPTION}`, error.message);
        return;
    }

    // Return values of all methods should be string, number, or Array of string & number
    if (!resultTypeCheck(result))
        throw new Error(`Type of return value of method '${method}' should be string, number, or Array of string & number`);

    // Convert result to CSV string
    let csvResult = stringifyJSON(result);

    // Send $callack message with return values of the method
    source.send(`${thingId}/$callack/${msgId}/${CALLACK.OK}`, csvResult);
}

function resultTypeCheck(result): boolean {
    if (result === undefined || result === null) return true;

    if (_.isArray(result)) {
        for (let value of result)
            if (!isStringOrNumber(value)) return false;
    }
    else if (!isStringOrNumber(result)) return false;

    return true;
}

function isStringOrNumber(value): boolean {
    if ((typeof value === 'string') || typeof value === 'number')
        return true;
    return false;
}
