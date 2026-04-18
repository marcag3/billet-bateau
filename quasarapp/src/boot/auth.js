import { boot } from "quasar/wrappers";
import { useAppState } from "../store/appState";

export default boot(({ router }) => {
    //attempt login before setting isLogged in store
    router.beforeEach(async (to) => {
        const appState = useAppState();
        await appState.initialyze(to);

        if (to.meta.auth === "guest client" && appState.guard === "client") {
            console.log("redirect logged");
            return { name: "client.home" };
        } else if (to.meta.auth === "guest user" && appState.guard === "user") {
            console.log("redirect logged");
            return { name: "user.dashboard" };
        } else if (to.meta.auth === "client" && appState.guard !== "client") {
            console.log("redirect guest");
            return { name: "client.welcome" };
        } else if (to.meta.auth === "user" && appState.guard !== "user") {
            console.log("redirect guest");
            return { name: "user.login" };
        }
    });
});
