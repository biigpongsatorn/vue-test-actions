import {
    MutationPayload,
    ActionPayload,
    Action,
    DispatchOptions,
    CommitOptions,
    StoreOptions,
    Payload
} from "vuex";

interface Expectation {
    t: Trigger;
    checkUsing?: void;
    callback?: void
}

declare const TRIGGER_TYPE_MUTATION = 'mutation';
declare const TRIGGER_TYPE_DISPATCH = 'dispatch';

declare function CHECK_FUNCTION_toEqual(
    type: string,
    received: Trigger,
    expected: Trigger,
    store: StoreOptions<Object>
): () => Promise<any>

declare function CHECK_FUNCTION_toEqual_permissive(
    type: string,
    received: Trigger,
    expected: Trigger,
    store: StoreOptions<Object>
): () => Promise<any>

declare class Trigger {
    type: string;
    name: string;
    payload?: any;
    options?: CommitOptions|DispatchOptions;
}

declare function testAction(
    action: Action<any, any>,
    expectations?: Array<Expectation>,
    actionPayload?: ActionPayload|undefined,
    store?: StoreOptions<Object>
): () => Promise<any>

declare namespace testAction { }

export {
    testAction,
    CHECK_FUNCTION_toEqual,
    CHECK_FUNCTION_toEqual_permissive,
    TRIGGER_TYPE_MUTATION,
    TRIGGER_TYPE_DISPATCH,
    Trigger
};
