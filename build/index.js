"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

/* global expect */

var mockAction = async function mockAction(action, payload, store, expectedMutations, expectedDispatchs) {
  var countMutation = 0;
  var countDispatch = 0;
  // Mock commit
  var commit = async function commit(type, payload) {
    try {
      if (expectedMutations.length !== 0) {
        var mutation = expectedMutations[countMutation];
        countMutation++;
        await expect(mutation.type).toEqual(type);
        if (payload !== undefined) {
          await expect(mutation.payload).toEqual(payload);
        }
      }
    } catch (e) {
      console.error("[COMMIT ERROR] ACTION : " + action.name + " \n " + e);
    }
  };
  // Mock dispatch
  var dispatch = function dispatch(type, payload) {
    try {
      if (expectedDispatchs.length !== 0) {
        var dispatcher = expectedDispatchs[countDispatch];
        countDispatch++;
        expect(dispatcher.type).toEqual(type);
        if (payload !== undefined) {
          expect(dispatcher.payload).toEqual(payload);
        }
      }
    } catch (e) {
      console.error("[DISPATCH ERROR] ACTION : " + action.name + " \n " + e);
    }
  };

  // Call the action with mocked store and arguments
  var result = void 0;
  try {
    result = await action(_extends({ commit: commit, dispatch: dispatch }, store), payload);
  } catch (e) {
    console.error("[ACTION ERROR] : " + action.name + " \n " + e);
  }
  // If not have mutations should have been dispatched 
  if (expectedMutations.length === 0) {
    expect(countMutation).toEqual(0);
  } else {
    expect(countMutation).toEqual(expectedMutations.length);
  }
  if (expectedDispatchs.length === 0) {
    expect(countDispatch).toEqual(0);
  } else {
    expect(countDispatch).toEqual(expectedDispatchs.length);
  }
  // If action return data.
  if (result !== undefined) {
    return result;
  }
};

exports.default = mockAction;