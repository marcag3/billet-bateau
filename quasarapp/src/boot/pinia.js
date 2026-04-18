import { boot } from "quasar/wrappers";
import { createPinia } from "pinia";
import { defaultActions, defaultState } from "../store/plugins";

const pinia = createPinia();

export default boot(({ app }) => {
    app.use(pinia);
    pinia.use(defaultActions);
    pinia.use(defaultState);
});

export { pinia };
