import Vue from "vue";
import VueX, { ActionContext } from "vuex";
import * as VTA from "../index";

Vue.use(VueX);

const actions = {
    increment(context: ActionContext<any, any>) {
        context.commit("increment");
        context.dispatch('console', {msg: "hello"})
    },
    console(context: ActionContext<any, any>, {msg}: {msg: string}) {
        console.log(msg);
    }
};

const store = new VueX.Store({
    state: {
        count: 0
    },
    mutations: {
        increment(state) {
            state.count++;
        }
    },
    actions: actions
});

store.dispatch("increment");

VTA.testAction(
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
);
