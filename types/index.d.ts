import { MutationPayload, ActionPayload, Action } from "vuex";

interface ExpectedMutations extends Array<MutationPayload> { }

interface ExpectedDispatchs extends Array<ActionPayload> { }

declare function testAction(
    action: Action<any, any>,
    expectedMutations: ExpectedMutations,
    actionPayload: any,
    store: any
): () => Promise<any>;

declare namespace testAction { }

export default testAction;
