/* global expect */

const testAction = async (action, expectedMutations, expectedDispatchs, actionPayload = undefined, store = { state: {}, getter: {} }) => {
  let countMutation = 0
  let countDispatch = 0

  const commit = async (type, payload) => {
    try {
      if (expectedMutations.length !== 0) {
        const mutation = expectedMutations[countMutation]
        countMutation++
        await expect(mutation.type).toEqual(type)
        if (payload !== undefined) {
          await expect(mutation.payload).toEqual(payload)
        }
      }
    } catch (e) {
      console.error(`[COMMIT FAIL], [ACTION '${action.name}'], \n ${e}`)
    }
  }

  const dispatch = (type, payload) => {
    try {
      if (expectedDispatchs.length !== 0) {
        const dispatcher = expectedDispatchs[countDispatch]
        countDispatch++
        expect(dispatcher.type).toEqual(type)
        if (payload !== undefined) {
          expect(dispatcher.payload).toEqual(payload)
        }
      }
    } catch (e) {
      console.error(`[DISPATCH FAIL], [ACTION '${action.name}'], \n ${e}`)
    }
  }

  let result
  try {
    result = await action({ commit, dispatch, ...store }, actionPayload)
  } catch (e) {
    console.error(`[ACTION '${action.name}' FAIL], \n ${e}`)
  }

  if (expectedMutations.length === 0) {
    expect(countMutation).toEqual(0)
  } else {
    expect(countMutation).toEqual(expectedMutations.length)
  }
  if (expectedDispatchs.length === 0) {
    expect(countDispatch).toEqual(0)
  } else {
    expect(countDispatch).toEqual(expectedDispatchs.length)
  }

  if (result !== undefined) {
    return result
  }
}

export default testAction
