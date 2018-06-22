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

testAction(action, expectedCommits, expectedDispatchs, payload, store)
```

# ⚙️ Params
| Params            | Type          | Default       | Description                       |
| ----------------- |:--------------|:--------------| ----------------------------------|
| action            | Function      | -             | Action function                   |
| expected commits  | Array         | `[]`          | Array of commit expectation       |
| expected dispatchs| Array         | `[]`          | Array of dispatchs expectation    |
| payload           | Any           | `undefined`    | Parameter send to action function |
| store             | Object        | `{ state: {}, getter: {} }`| Object for mock store data such as `state` or `getter` |


# 🔎 Example

```javascript
// user/actions.js

import userSerive from '../myUserService'

export async function getUser ({ commit, dispatch }, userId) {
  commit('setLoading', true)
  try {
    const { data } = await userSerive.fetchUser(userId)
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

import testAction from 'vue-test-actions'
import * as actions from '~/store/user/actions'
import userSerive from '~/services/myUserService'

describe('getUser', () => {
  test('If success', () => {
    const payload = 1
    userSerive.fetchUser = jest.fn().mockReturnValue({ data: { id: 1 } })
    const expectedCommits = [
      { type: 'setLoading', payload: true },
      { type: 'setUser', payload: { id: 1 } },
      { type: 'setLoading', payload: false }
    ]
    const expectedDispatchs = [
      { type: 'getUserPermission', payload: 1 }
    ]
    testAction(actions.getUser, expectedCommits, expectedDispatchs, payload)
  })
})

```

# 🤝 Contributing
1. Fork this repository.
2. Create new branch with feature name.
3. Create your feature.
4. Commit and set commit message with feature name.
5. Push your code to your fork repository.
6. Create pull request. 🙂

# ⭐️ Support

```
If you like this project, You can support me with starring ⭐ this repository.
```

# 🖊 License

[MIT](LICENSE)

Developed with ❤️ and ☕️ 
