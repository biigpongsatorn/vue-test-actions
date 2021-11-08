/* global expect */

const TRIGGER_TYPE_MUTATION = 'mutation';
const TRIGGER_TYPE_DISPATCH = 'dispatch';
const TRIGGER_TYPE_UNSET = "NOT SET";

/**
 * A mutation or dispatch store event expectation.
 * @classdesc A Trigger is a store event triggered within a store Action. It will have a type (TRIGGER_TYPE_*) and a name, and may optionally have a payload and options.
 * @see https://vuex.vuejs.org/api/#commit
 * @see https://vuex.vuejs.org/api/#dispatch
 * @export
 */
class Trigger {
  /**
   * @constructor
   * @param type {string|{type:string, name:string, payload:Object|undefined, options:Object|undefined}} trigger The type of trigger (TRIGGER_TYPE_* constant) or an object with the other arguments as properties.
   * @param {string} [name] The name of the mutation or dispatch (first argument in the call)
   * @param {*} [payload=undefined] The payload sent to the mutation or dispatch
   * @param {Object|undefined} [options] Options passed to the trigger
   */
  constructor(type, name, payload = undefined, options = undefined) {
    if(typeof type === 'object') {
      options = type.options;
      payload = type.payload;
      name = type.name;
      type = type.type;
    }
    if(type !== TRIGGER_TYPE_DISPATCH &&
        type !== TRIGGER_TYPE_MUTATION &&
        type !== TRIGGER_TYPE_UNSET
    )
      throw new Error(`store_trigger_name must be a valid TRIGGER_TYPE_* constant (received "${type}")`);
    if(typeof name !== 'string')
      throw new TypeError('name must be a string');
    if(options && typeof options !== 'object')
      throw new TypeError('options must be an object');

    this.type = type;
    this.name = name;
    this.payload = payload;
    this.options = options;
  }
}

/**
 * Function used to check an Expectation against an emitted store trigger. No error wrapping is provided to allow throw() to fail tests immediately.
 * @callback customTest
 * @param {string} triggerType Type of the trigger (TRIGGER_TYPE_* constant)
 * @param {Trigger} received store trigger
 * @param {Trigger} expected store trigger
 * @param {Object.<Object>} store stub object
 *
 * @return {*}
 */

/**
 * Callback executed after an Expectation occurs
 * @callback expectationCallback
 * @param {Trigger} received Trigger received from the Action
 * @param {Trigger|undefined} expected Trigger expected in the Test
 * @param {Object.<Object>} store stub object
 *
 * @return {void}
 */

/**
 * A mutation or dispatch store event expectation
 * @typedef {Object} Expectation
 * @property {Trigger} t The Trigger expected
 * @property {customTest|void} [checkUsing] Function used to override default test approach
 * @property {expectationCallback|void} [callback] Function to execute
 */

/**
 * Test an action fires the expected events.
 * Actions are evaluated against a series of expectations of the store events they trigger. Each expectation consists of a type and a payload, and can be an expected mutation (`store.commit(type, payload)`) or dispatch (`store.dispatch(type, payload)`). These expectations are compared to the events triggered by the action. The mutations and dispatches are inspected in order (the first trigger in the action is compared to the first expectation, the second trigger to the second expectation, etc.).
 * Default checking requires that the trigger and the expectation pass a Jest toEqual(). If they do not pass, an error is thrown.
 * @param {function} action Action to call
 * @param {Expectation[]} [expectations] Store triggers that the action is expected to invoke
 * @param {Object|undefined} [actionPayload=undefined] Payload data sent to the action
 * @param {Object.<Object>} [store={state:{}, getters:{}, rootGetters:{}, rootState:{}}] Vuex store stub (object containing store subfields such as state, getters, etc)
 * @param {function} [checkUsing=CHECK_FUNCTION_toEqual] Function to use to check expectations. Can be one of the predefined CHECK_FUNCTION_* constants or a custom function (usually containing one or more JEST expect() chains). This function can be overwritten on a per-expectation basis by supplying a customTest property in the Expectation.
 * @return {Promise<Error|*>}
 *
 * @export
 */
const testAction = async (action, expectations, actionPayload = undefined, store = { state: {}, getters: {}, rootGetters: {}, rootState: {} }, checkUsing = CHECK_FUNCTION_toEqual) => {
  try {
    return await _testAction(
        action, expectations, actionPayload, store, checkUsing
    )
  } catch (e) {
    return e;
  }
};

/**
 * @param {function} action Action to call
 * @param {Expectation[]} [expectations] Store triggers that the action is expected to invoke
 * @param {Object|undefined} [actionPayload=undefined] Payload data sent to the action
 * @param {Object.<Object>} [store={state:{}, getters:{}, rootGetters:{}, rootState:{}}] Vuex store stub (object containing store subfields such as state, getters, etc)
 * @param {function} [checkUsing=CHECK_FUNCTION_toEqual] Function to use to check expectations. Can be one of the predefined CHECK_FUNCTION_* constants or a custom function (usually containing one or more JEST expect() chains). This function can be overwritten on a per-expectation basis by supplying a customTest property in the Expectation.
 * @return {Promise<*>}
 *
 * @export
 */
const _testAction = async (action, expectations, actionPayload = undefined, store = { state: {}, getters: {}, rootGetters: {}, rootState: {} }, checkUsing = CHECK_FUNCTION_toEqual) => {
  let checks = [];
  let result = [];
  let triggerIndex = 0;

  // Check that expectations have been specified properly
  if(expectations && !(expectations instanceof Array))
    throw new TypeError(`expectations must be of array type (type provided: ${typeof expectations}).`);
  expectations = expectations.map((e, i) => {
    const trigger = e.t instanceof Trigger? e.t : new Trigger(e.t);
      if(e.checkUsing && typeof e.checkUsing !== 'function')
        throw new TypeError(`Unable to process expectation ${i}: checkUsing must be a function (type provided: ${typeof e.checkUsing}).`);
      if(e.callback && typeof e.callback !== 'function')
        throw new TypeError(`Unable to process expectation ${i}: callback must be a function (type provided: ${typeof e.callback}).`);
      return {t: trigger, checkUsing: e.checkUsing, callback: e.callback};
  });

  // Wrappers to add the trigger type to the check call
  const commit = async (name, payload, options) =>
      processStoreTrigger(TRIGGER_TYPE_MUTATION, name, payload, options);
  const dispatch = async (name, payload, options) =>
      processStoreTrigger(TRIGGER_TYPE_DISPATCH, name, payload, options);

  // Check that happens for each trigger
  const processStoreTrigger = async (type, name, payload, options) => {
    let received;
    try {
      received = new Trigger(type, name, payload, options);
    } catch(e) {
      throw new Error(
          'Error constructing Trigger for received store event. This is likely a problem in the call to .commit() or .dispatch() in your action code.'
      );
    }

    let expected = null;
    if(expectations.length > triggerIndex)
      expected = expectations[triggerIndex];

    if(!expected)
      expected = {t: new Trigger(TRIGGER_TYPE_UNSET, "")};

    triggerIndex++;

    const oldStore = store // TODO: deep copy

    // callback
    if(expected.callback)
      expected.callback(received, expected, store)

    return checks.push({
      type,
      received,
      expected: expected.t,
      checkUsing: expected.checkUsing,
      oldStore
    })
  };

  try {
    result = await action({ commit, dispatch, ...store }, actionPayload);
  } catch (e) {
    console.error(`[ACTION '${action.name}' FAIL], \n ${e}`);
  }

  return {checks, result};
};

/**
 * Check that received and expected have the same type and name using toEqual() and check that payload serialises to the same string using toEqual().
 * @type customTest
 * @param type {string} Store trigger type
 * @param received {Trigger} The Trigger produced by the action
 * @param expected {Trigger} The Trigger expected
 * @param {Object.<Object>} [store] Store stub object
 * @return {Promise<void>}
 *
 * @export
 */
const CHECK_FUNCTION_toEqual = (type, received, expected, store) => {
  expect(received.type).toEqual(expected.type);
  expect(received.name).toEqual(expected.name);
  if(expected.payload !== undefined)
    expect(JSON.stringify(received.payload))
        .toEqual(JSON.stringify(expected.payload));
};

/**
 * Check that received and expected have the same type and name using toEqual() and check that payload serialises to the same string using toEqual(). Errors are caught and printed in the console, so the check always passes.
 * @type customTest
 * @param type {string} Store trigger type
 * @param received {Trigger} The Trigger produced by the action
 * @param expected {Trigger} The Trigger expected
 * @param {Object.<Object>} [store] Store stub object
 * @return {Promise<void>}
 *
 * @export
 */
const CHECK_FUNCTION_toEqual_permissive = (type, received, expected, store) => {
  try {
    expect(received.type).toEqual(expected.type);
    expect(received.name).toEqual(expected.name);
    if(expected.payload !== undefined)
      expect(JSON.stringify(received.payload))
          .toEqual(JSON.stringify(expected.payload));
  } catch (e) {
    console.error(`${received.type.toUpperCase()} '${received.name}' not as expected: \n ${e}`);
  }
};

let CHECK_FUNCTION = CHECK_FUNCTION_toEqual;

const checkResults = ({checks, result}) => {
  checks.forEach(c => {
    if(c.checkUsing)
      c.checkUsing(c.type, c.received, c.expected, c.store);
    else
      CHECK_FUNCTION(c.type, c.received, c.expected, c.store);
  });
  return result;
};

export {
  testAction,
  checkResults,
  CHECK_FUNCTION,
  CHECK_FUNCTION_toEqual,
  CHECK_FUNCTION_toEqual_permissive,
  TRIGGER_TYPE_MUTATION,
  TRIGGER_TYPE_DISPATCH,
  Trigger
};
