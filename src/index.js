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
    if(type === null || type === undefined)
      throw new Error('Cannot construct Trigger from empty input.');

    if(typeof type === 'object') {
      // Check the user hasn't put check_function or callback in the wrong place
      if(type.check_function)
        throw new Error('Found "check_function" property of Trigger. The check_function is a property of the Expectation itself, not the Expectation\'s Trigger property (t)');
      if(type.callback)
        throw new Error('Found "callback" property of Trigger. The callback is a property of the Expectation itself, not the Expectation\'s Trigger property (t)');
      options = type.options;
      payload = type.payload;
      name = type.name;
      type = type.type;
    }
    if(type !== TRIGGER_TYPE_DISPATCH &&
        type !== TRIGGER_TYPE_MUTATION &&
        type !== TRIGGER_TYPE_UNSET
    )
      throw new Error(`Trigger type must be a valid TRIGGER_TYPE_* constant (received "${type}")`);
    if(typeof name !== 'string')
      throw new TypeError('Trigger name must be a string');
    if(options && typeof options !== 'object')
      throw new TypeError('Trigger options must be an object');

    this.type = type;
    this.name = name;
    this.payload = payload;
    this.options = options;
  }
}

/**
 * Function used to check an Expectation against an emitted store trigger. No error wrapping is provided to allow throw() to fail tests immediately.
 * @callback customTest
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
 * @property {customTest|void} [check_function] Function used to override default test approach
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
 * @param {function} [check_function] Function to use to check expectations. Can be one of the predefined CHECK_FUNCTION_* constants or a custom function (usually containing one or more JEST expect() chains). This function can be overwritten on a per-expectation basis by supplying a customTest property in the Expectation.
 * @return {Promise<Error|*>}
 *
 * @export
 */
const testAction = async (action, expectations, actionPayload = undefined, store = { state: {}, getters: {}, rootGetters: {}, rootState: {} }, check_function) => {
  return evaluateAction(action, expectations, actionPayload, store)
      .then(({checks, result}) => checkResults({checks, result, check_function}))
};

/**
 * Run an action to produce its store triggers.
 * @param {function} action Action to call
 * @param {Expectation[]} [expectations] Store triggers that the action is expected to invoke
 * @param {Object|undefined} [actionPayload=undefined] Payload data sent to the action
 * @param {Object.<Object>} [store={state:{}, getters:{}, rootGetters:{}, rootState:{}}] Vuex store stub (object containing store subfields such as state, getters, etc)
 * @return {Promise<Error|*>}
 *
 * @export
 */
const evaluateAction = async (action, expectations, actionPayload = undefined, store = { state: {}, getters: {}, rootGetters: {}, rootState: {} }) => {
  let checks = [];
  let result = null;
  let triggerIndex = 0;

  // Check that expectations have been specified properly
  if(expectations && !(expectations instanceof Array))
    throw new TypeError(`expectations must be of array type (type provided: ${typeof expectations}).`);
  expectations = expectations.map((e, i) => {
    if(!e.t)
      throw new Error('No property \'t\' present in Expectation (did you put the trigger properties directly in the expectation?).');
    const trigger = e.t instanceof Trigger? e.t : new Trigger(e.t);
      if(e.check_function && typeof e.check_function !== 'function')
        throw new TypeError(`Unable to process expectation ${i}: check_function must be a function (type provided: ${typeof e.check_function}).`);
      if(e.callback && typeof e.callback !== 'function')
        throw new TypeError(`Unable to process expectation ${i}: callback must be a function (type provided: ${typeof e.callback}).`);
      return {t: trigger, check_function: e.check_function, callback: e.callback};
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

    // Partially recopy store making sure that state variables are
    // reinstanced rather than rereferenced.
    // Objects in state variables will still be referenced, however.
    const oldStore = {
      ...store,
      state: {...store.state},
      rootState: {...store.rootState}
    };

    checks.push({
      received,
      expected: expected.t,
      check_function: expected.check_function,
      oldStore
    });

    // callback
    if(expected.callback)
      return await expected.callback(received, expected, store);
  };

  try {
    result = await action({ commit, dispatch, ...store }, actionPayload);
  } catch (e) {
    throw new Error(`[ACTION '${action.name}' FAIL] This could be due to an error in your store action code or in a callback supplied as part of your test.`);
  }

  if(checks.length !== expectations.length)
    throw new Error(`${action.name} triggered the wrong number of events. Expected ${expectations.length}, received ${checks.length}.`);

  return {checks, result};
};

/**
 * Check that received and expected have the same type and name using toEqual() and check that payload serialises to the same string using toEqual().
 * @type customTest
 * @param received {Trigger} The Trigger produced by the action
 * @param expected {Trigger} The Trigger expected
 * @param {Object.<Object>} [store] Store stub object
 * @return {Promise<void>}
 *
 * @export
 */
const CHECK_FUNCTION_toEqual = (received, expected, store) => {
  expect(received).toEqual(expected);
};

/**
 * Check that received and expected have the same type and name using toEqual() and check that payload serialises to the same string using toEqual(). Errors are caught and printed in the console, so the check always passes.
 * @type customTest
 * @param received {Trigger} The Trigger produced by the action
 * @param expected {Trigger} The Trigger expected
 * @param {Object.<Object>} [store] Store stub object
 * @return {Promise<void>}
 *
 * @export
 */
const CHECK_FUNCTION_toEqual_permissive = (received, expected, store) => {
  try {
    expect(received).toEqual(expected);
  } catch (e) {
    console.error(`${received.type.toUpperCase()} '${received.name}' not as expected: \n ${e}`);
  }
};

/**
 * Perform the checks for each of the registered checks, then return the result of the action.
 * @param checks {{type: string, received: Trigger, expected: Trigger, store: Object.<Object>, check_function?: function}[]} List of checks to run
 * @param result {*} Result of the action
 * @callback [check_function] {customTest} Custom function used to check checks
 * @return {*} Result of the action
 */
const checkResults = ({checks, result, check_function}) => {
  checks.forEach(c => {
    // Determine which function to use for checking
    let f = options.check_function;
    if(check_function)
      f = check_function;
    if(c.check_function)
      f = c.check_function;

    f(c.received, c.expected, c.store);
  });
  return result;
};

/**
 * Hold the options for the module. These can be set by the user.
 * @type {{check_function: customTest}}
 */
const options = {
  check_function: CHECK_FUNCTION_toEqual
};

export {
  testAction,
  checkResults,
  options,
  CHECK_FUNCTION_toEqual,
  CHECK_FUNCTION_toEqual_permissive,
  TRIGGER_TYPE_MUTATION,
  TRIGGER_TYPE_DISPATCH,
  Trigger
};
