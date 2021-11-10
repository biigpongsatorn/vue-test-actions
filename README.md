# ✅ Vue Test Actions <a href="https://biigpongsatorn.github.io/#/vue-test-actions"><img src="https://travis-ci.org/biigpongsatorn/biigpongsatorn.github.io.svg?branch=dev" alt="build status"></a>
<a href="https://npmjs.com/package/vue-test-actions"><img src="https://img.shields.io/npm/v/vue-test-actions.svg?style=flat" alt="NPM version"></a> <a href="https://npmjs.com/package/vue-test-actions"><img src="https://img.shields.io/npm/dm/vue-test-actions.svg?style=flat" alt="NPM downloads"></a> <a href="https://www.npmjs.com/package/vue-test-actions"><img src="https://img.shields.io/npm/l/vue-test-actions.svg?style=flat" alt="License"></a>

Unit testing Vuex actions with Jest mocks.

# 💻 Install

```sh
npm i --save vue-test-actions
```
or
```sh
yarn add vue-test-actions
```

# 🕹 Usage

```javascript
import testAction from 'vue-test-actions'

testAction(action, expectations, payload, store, check_function)
```

# ⚙ Params
| Params            | Type          | Default       | Description                       |
| ----------------- |:--------------|:--------------| ----------------------------------|
| action            | Function      | -             | Action function                   |
| expectations | `Expectation[]` (see below) | -          | Array of expectations    |
| payload           | Any           | `undefined`    | Parameter send to action function |
| store             | Object        | `{ state: {}, getters: {}, rootState: {}, rootGetters: {} }`| Object for mock store data such as `state` or `getters` |
| check_function      | function    | -     | Function to use for checking expectations against received events (overrides options.check_function) |

## Objects

The package contains two objects that are worth understanding: `Expectation`s and `Trigger`s.

### `Expectation`

Expectation objects contain information about the store events an action is supposed to fire (`Trigger`s), as well as supporting using custom test functions and callbacks.
They have the following properties: 

| Property | Type | Description |
|----------|:-----|-------------|
| t        | `Trigger` (see below) | Trigger object describing the store event that is expected |
| check_function | function | Function used to check the triggers. This function will be called with the arguments `received: Trigger` (the store event called by your action), `expected: Trigger` (the store event specified in your test), `store: Object` (the store object in your test for reference).  |
| callback | function | Function that is run at the end of the trigger. If you want to mock changes that your events would make to the store, you can do that using this callback. It is called with the arguments `received: Trigger` (the store event called by your action), `expected: Trigger` (the store event specified in your test), `store: Object` (the store object in your test). |

### `Trigger`

`Trigger` objects describe a store event.
This is either a [mutation](https://vuex.vuejs.org/api/#commit) or a [dispatch](https://vuex.vuejs.org/api/#dispatch).

| Property | Type | Description |
|----------|:-----|-------------|
| type     | string | Either "mutation" or "dispatch". |
| name | string | The name of the store event being called. |
| payload | object | Data passed to the store event. |
| options | object | Options passed to the store event. |


# 🔎 Example

```javascript
// user/actions.js

import userService from '../myUserService'

// Function that interacts with the store
export async function getUser ({ commit, dispatch }, userId) {
  commit('setLoading', true)
  try {
    const { data } = await userService.fetchUser(userId)
    commit('setUser', data)
    dispatch('getUserPermission', data.id)
  } catch (e) {
    commit('setNotificationError', true)
  }
  commit('setLoading', false)
}
```

```javascript
// user.spec.js

import {
    testAction,
    TRIGGER_TYPE_MUTATION,
    TRIGGER_TYPE_DISPATCH 
} from 'vue-test-actions'
import * as actions from '~/store/user/actions'
import userService from '~/services/myUserService'

describe('getUser', () => {
  test('If success', () => {
    const payload = 1
    const user = { id: payload }
    userService.fetchUser = jest.fn().mockReturnValue({data: user})
    const expectations = [
        { 
            t: {
                type: TRIGGER_TYPE_MUTATION,
                name: 'setLoading',
                payload: true
                } 
        },
        { 
            t: {
                type: TRIGGER_TYPE_MUTATION,
                name: 'setUser',
                payload: user
                } 
        },
        { 
            t: {
                type: TRIGGER_TYPE_DISPATCH,
                name: 'getUserPermission',
                payload: user.id
                } 
        },
        { 
            t: {
                type: TRIGGER_TYPE_MUTATION,
                name: 'setLoading',
                payload: false
                } 
        }
    ]

    // We return the value because otherwise errors in promises
    // will cause deprecated errors that will kill the nodeJS process.
    // So either use
    // `() => testAction(...)`
    // or
    // `() => { return testAction(...) }`
    return testAction(actions.getUser, expectations, payload)
  })
})

```

# ⚡ Gotchas

The package allows you to provide callbacks that can (among other things) modify the store. 
It also allows you to write your own custom_function to test the output. 
The value of `store` passed to your custom function is a shallow copy of the `store` as it stood before the callback was run. 
The `store.state` and `store.rootState` variables are copies, although any changes to _objects_ within those states will still appear changed in the test.

# 🤝 Contributing
1. Fork this repository.
2. Create new branch with feature name.
3. Create your feature.
4. Commit and set commit message with feature name.
5. Push your code to your fork repository.
6. Create pull request. 🙂

# ⭐ Support

```
If you like this project, You can support me with starring ⭐ this repository.
```

# 🖊 License

[MIT](LICENSE)

Developed with ❤️ and ☕️ 


# Version 2.0

* **Revised test syntax** to ensure that failed tests fail and passed tests pass properly
* **Collapse mutations and dispatches together** so the relative order matters, too
* **Trigger tests are no longer wrapped for expectations by default**
* Add support for custom test functions
* Added small suite of frequently-used test functions
* Add support for callbacks after store triggers are fired (e.g. to mock state updates that would be triggered)
* Added jsdoc documentation to some code
* Added tests for most functionality
