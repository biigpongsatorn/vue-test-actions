import * as VTA from "../src/index";

// Extend JEST slightly to provide better object equality Error checking.
// We can't use the more friendly expect(...).toThrow() syntax because
// we're working with promises.
expect.extend({
    /**
     * Expect an error. Optionally expect the error string to contain a string.
     * @param error {Error}
     * @param [expected] {string} Simple string matching against error content
     * @return {{pass: boolean, message: (function(): string)}}
     */
    toBeError(error, expected) {
        if(!expected)  {
            // No expected, just check Error-ness
            if(error instanceof Error)
                return {
                    message: () => `expected type of received not to be Error, got type ${typeof Error}`,
                    pass: true
                };
            else
                return {
                    message: () => `expected type of received to be Error, not ${typeof Error}`,
                    pass: false
                };
        }

        // Check contents
        if (`${error.name.toLowerCase()}: ${error.message.toLowerCase()}`.indexOf(expected.toLowerCase()) !== -1) {
            return {
                message: () =>
                    `expected "${error.name}: ${error.message}" not to contain "${expected}"`,
                pass: true,
            };
        } else {
            return {
                message: () =>
                    `expected "${error.name}: ${error.message}" to contain "${expected}"`,
                pass: false,
            };
        }
    },
});

describe('vue-test-actions', () => {
    let actions, store;
    beforeEach(() => {
        // Reset the check function
        VTA.options.check_function = VTA.CHECK_FUNCTION_toEqual;

        actions = {
            increment(context) {
                context.commit("increment");
                context.dispatch('console', {msg: "hello"})
            },
            // Deliberate mistake in store function
            foobar(context, payload) {
                context.commit({payload})
            },
            console(context, {msg}) {
                console.log(msg);
            },
            answer(context) {
                context.commit("increment");
                return context.state.count;
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
                },
                decrement(state) {
                    state.count--;
                }
            },
            actions: actions
        };
    });

    it('handles a minimal example', () => {
        return VTA.testAction(
            context => context.commit('add', 3),
            [{t: {type: "mutation", name: "add", payload: 3}}]
        )
    })

    it('processes a simple example', () => {
        // We MUST return the value because otherwise errors in promises
        // will cause deprecated errors that will kill the nodeJS process.
        // So either use
        // `() => testAction(...)`
        // or
        // `() => { return testAction(...) }`
        return VTA.testAction(
            actions.increment,
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
        )
            .then(output => expect(output).toBeUndefined())
    });

    it('fails when expectations are not an Array', () => {
        return VTA.testAction(
            actions.increment,
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_MUTATION,
                        name: "increment",
                        payload: {oops: 0}
                    },
                    check_function: VTA.CHECK_FUNCTION_toEqual_permissive
                }
        )
            .catch(e => {
                expect(e).toBeError();
                return -Infinity;
            })
            .then(x => {
                if(x === -Infinity)
                    return;
                throw('Function succeeded unexpectedly.')
            })
    });

    it('fails when expectations are missing trigger data', () => {
        return VTA.testAction(
            actions.increment,
            [
                {
                    check_function: VTA.CHECK_FUNCTION_toEqual_permissive
                }
            ]
        )
            .catch(e => {
                expect(e).toBeError("Trigger from empty input");
                return -Infinity;
            })
            .then(x => {
                if(x === -Infinity)
                    return;
                throw('Function succeeded unexpectedly.')
            })
    });

    it('fails when expectation Trigger.type is misspecified', () => {
        return VTA.testAction(
            actions.increment,
            [
                {
                    t: {
                        type: "mootation",
                        name: "increment",
                        payload: {oops: 0}
                    },
                    check_function: VTA.CHECK_FUNCTION_toEqual_permissive
                }
            ]
        )
            .catch(e => {
                expect(e).toBeError("type must be a valid TRIGGER_TYPE_* constant");
                return -Infinity;
            })
            .then(x => {
                if(x === -Infinity)
                    return;
                throw('Function succeeded unexpectedly.')
            })
    });

    it('fails when expectation Trigger.name is misspecified', () => {
        return VTA.testAction(
            actions.increment,
            [
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_MUTATION,
                        name: actions.increment,
                        payload: {oops: 0}
                    },
                    check_function: VTA.CHECK_FUNCTION_toEqual_permissive
                }
            ]
        )
            .catch(e => {
                expect(e).toBeError("name must be a string");
                return -Infinity;
            })
            .then(x => {
                if(x === -Infinity)
                    return;
                throw('Function succeeded unexpectedly.')
            })
    });

    it('fails when expectation Trigger.options is misspecified', () => {
        return VTA.testAction(
            actions.increment,
            [
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_MUTATION,
                        name: "increment",
                        payload: {oops: 0},
                        options: "root"
                    },
                    check_function: VTA.CHECK_FUNCTION_toEqual_permissive
                }
            ]
        )
            .catch(e => {
                expect(e).toBeError("options must be an object");
                return -Infinity;
            })
            .then(x => {
                if(x === -Infinity)
                    return;
                throw('Function succeeded unexpectedly.')
            })
    });

    it('fails when expectation check_function is misspecified', () => {
        return VTA.testAction(
            actions.increment,
            [
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_MUTATION,
                        name: "increment",
                        payload: {oops: 0}
                    },
                    check_function: "VTA.CHECK_FUNCTION_toEqual_permissive"
                }
            ]
        )
            .catch(e => {
                expect(e).toBeError("check_function must be a function");
                return -Infinity;
            })
            .then(x => {
                if(x === -Infinity)
                    return;
                throw('Function succeeded unexpectedly.')
            })
    });

    it('fails when expectation callback is misspecified', () => {
        return VTA.testAction(
            actions.increment,
            [
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_MUTATION,
                        name: "increment",
                        payload: {oops: 0}
                    },
                    check_function: VTA.CHECK_FUNCTION_toEqual_permissive,
                    callback: "foo"
                }
            ]
        )
            .catch(e => {
                expect(e).toBeError("callback must be a function");
                return -Infinity;
            })
            .then(x => {
                if(x === -Infinity)
                    return;
                throw('Function succeeded unexpectedly.')
            })
    });

    it('fails when expectation check_function is in the wrong place', () => {
        return VTA.testAction(
            actions.increment,
            [
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_MUTATION,
                        name: "increment",
                        payload: {oops: 0},
                        check_function: VTA.CHECK_FUNCTION_toEqual_permissive
                    }
                }
            ]
        )
            .catch(e => {
                expect(e).toBeError("check_function is a property of the Expectation");
                return -Infinity;
            })
            .then(x => {
                if(x === -Infinity)
                    return;
                throw('Function succeeded unexpectedly.')
            })
    });

    it('fails when expectation callback is in the wrong place', () => {
        return VTA.testAction(
            actions.increment,
            [
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_MUTATION,
                        name: "increment",
                        payload: {oops: 0},
                        callback: () => {}
                    },
                    check_function: VTA.CHECK_FUNCTION_toEqual_permissive
                }
            ]
        )
            .catch(e => {
                expect(e).toBeError("callback is a property of the Expectation itself");
                return -Infinity;
            })
            .then(x => {
                if(x === -Infinity)
                    return;
                throw('Function succeeded unexpectedly.')
            })
    });

    it('fails when not enough triggers are generated', () => {
        return VTA.testAction(
            actions.increment,
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
                },
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_MUTATION,
                        name: "foobar"
                    }
                }
            ],
            undefined,
            store
        )
            .catch(e => {
                expect(e).toBeError("triggered the wrong number");
                return -Infinity;
            })
            .then(x => {
                if(x === -Infinity)
                    return;
                throw('Function succeeded unexpectedly.')
            })
    });

    it('fails when not enough triggers are expected', () => {
        return VTA.testAction(
            actions.increment,
            [
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_MUTATION,
                        name: "increment",
                        payload: undefined
                    }
                }
            ],
            undefined,
            store
        )
            .catch(e => {
                expect(e).toBeError("triggered the wrong number");
                return -Infinity;
            })
            .then(x => {
                if(x === -Infinity)
                    return;
                throw('Function succeeded unexpectedly.')
            })
    });

    it('fails when the wrong type of event is triggered', () => {
        return VTA.testAction(
            actions.increment,
            [
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_DISPATCH,
                        name: "console",
                        payload: {msg: "hello"}
                    }
                },
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_MUTATION,
                        name: "increment",
                        payload: undefined
                    }
                }
            ],
            undefined,
            store
        )
            .catch(e => {
                expect(e).toBeError("dispatch");
                return -Infinity;
            })
            .then(x => {
                if(x === -Infinity)
                    return;
                throw('Function succeeded unexpectedly.')
            })
    });

    it('fails when the wrong event is triggered', () => {
        return VTA.testAction(
            actions.increment,
            [
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_MUTATION,
                        name: "decrement",
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
        )
            .catch(e => {
                expect(e).toBeError("decrement")
                return -Infinity;
            })
            .then(x => {
                if(x === -Infinity)
                    return;
                throw('Function succeeded unexpectedly.')
            })
    });

    it('fails when the wrong payload is received', () => {
        return VTA.testAction(
            actions.increment,
            [
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_MUTATION,
                        name: "increment",
                        payload: {amount: 10}
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
        )
            .catch(e => {
                expect(e).toBeError("expected value to equal")
                return -Infinity;
            })
            .then(x => {
                if(x === -Infinity)
                    return;
                throw('Function succeeded unexpectedly.')
            })
    });

    it('fails when the wrong options are present', () => {
        return VTA.testAction(
            actions.increment,
            [
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_MUTATION,
                        name: "increment",
                        payload: undefined,
                        options: {root: true}
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
        )
            .catch(e => {
                expect(e).toBeError("expected value to equal")
                return -Infinity;
            })
            .then(x => {
                if(x === -Infinity)
                    return;
                throw('Function succeeded unexpectedly.')
            })
    });

    it('supports Trigger.check_function', () => {
        return VTA.testAction(
            actions.increment,
            [
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_MUTATION,
                        name: "foobar",
                        payload: {foo: "bar"}
                    },
                    check_function: () => true
                },
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_DISPATCH,
                        name: "console",
                        payload: {msg: "hello"}
                    },
                    check_function: () => expect("hi").toMatch("Low")
                }
            ],
            undefined,
            store
        )
            .catch(e => {
                expect(e).toBeError("expected value to match")
                return -Infinity;
            })
            .then(x => {
                if(x === -Infinity)
                    return;
                throw('Function succeeded unexpectedly.')
            })
    });


    it('supports options.check_function', () => {
        VTA.options.check_function = () => true;
        return VTA.testAction(
            actions.increment,
            [
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_MUTATION,
                        name: "foobar",
                        payload: {foo: "bar"}
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
        )
            .then(output => expect(output).toBeUndefined())
    });


    it('supports check_function', () => {
        return VTA.testAction(
            actions.increment,
            [
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_MUTATION,
                        name: "foobar",
                        payload: {foo: "bar"}
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
            store,
            () => true
        )
            .then(output => expect(output).toBeUndefined())
    });


    it('supports callbacks', () => {
        let pass = false;
        return VTA.testAction(
            actions.increment,
            [
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_MUTATION,
                        name: "increment",
                        payload: undefined
                    },
                    callback: () => pass = true
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
            .then(() => expect(pass).toBe(true))
    });


    it('supports return values', () => {
        return VTA.testAction(
            actions.answer,
            [
                {
                    t: {
                        type: VTA.TRIGGER_TYPE_MUTATION,
                        name: "increment"
                    },
                    // Callback that actually performs the update
                    callback: () => store.mutations.increment(store.state)
                }
            ],
            undefined,
            store
        )
            .then(n => expect(n).toBe(1))
    });
});

