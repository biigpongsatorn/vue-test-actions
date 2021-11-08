import * as VTA from "../src/index";
import {checkResults} from "../src/index";

describe('vue-test-actions', () => {
    let actions, store;
    beforeEach(() => {
        actions = {
            increment(context) {
                context.commit("increment");
                context.dispatch('console', {msg: "hello"})
            },
            console(context, {msg}) {
                console.log(msg);
            }
        };

        // Mock up the store
        store = {
            state: {
                count: 0
            },
            mutations: {
                increment(state) {
                    state.count++;
                }
            },
            actions: actions
        };
    });

    it('processes a simple example', () => {
        expect(VTA.testAction(
            actions.increment,
            'foobar',
            [
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_MUTATION,
                        name: "increment",
                        payload: undefined
                    }
                },
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_DISPATCH,
                        name: "console",
                        payload: {msg: "hello"}
                    }
                }
            ],
            undefined,
            store
        )).resolves.toBeNull();
    })

    it('fails a simple example', async () => {
        VTA.testAction(
            actions.increment,
            {blah: 'foo'},
            [
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_DISPATCH,
                        name: "increment",
                        payload: undefined
                    }
                },
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_DISPATCH,
                        name: "console",
                        payload: {msg: "hello"}
                    }
                }
            ],
            undefined,
            store
        ).catch(e => {console.error(e); throw e})
    })

    it('fails on trigger type', async () => {
        const fail = async () => {throw new Error('no')}
        await expect( () => {
            VTA.testAction(
                actions.increment,
                [
                    {
                        t: {
                            type: VTA.TRIGGER_TYPE_DISPATCH,
                            name: "increment",
                            payload: undefined
                        },
                        checkUsing: fail
                    },
                    {
                        t: {
                            type: VTA.TRIGGER_TYPE_DISPATCH,
                            name: "console",
                            payload: {msg: "hello"}
                        }
                    }
                ],
                undefined,
                store
            )
        })
            .toThrow()
    })

    it('fails', () => {
        return VTA.testAction(
            actions.increment,
            [
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_MUTATION,
                        name: "increment",
                        payload: {oops: 0}
                    },
                    checkUsing: VTA.CHECK_FUNCTION_toEqual_permissive
                }
            ]
        )
            .then(checkResults)
            .then(output => expect(output).toBeNull())
    })
})

