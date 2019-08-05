import Vue from "vue";
import VueX, { ActionContext } from "vuex";
import testAction from "../index";

Vue.use(VueX);

const actions = {
    increment(context: ActionContext<any, any>) {
        context.commit("increment");
        context.commit('console')
    },
    console() {
        console.log('hello');
    }
}

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

testAction(
    actions.increment,
    [{ type: "increment", payload: undefined }],
    [{ type: "console", payload: undefined }],
    undefined
);
