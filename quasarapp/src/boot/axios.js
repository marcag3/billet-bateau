import axios from "axios";
import { useAppState } from "src/store/appState";
import { useServerValidations } from "src/store/serverValidations";
import { alertError } from "src/utilities/helpers";
import { i18n } from "./i18n";

const api = axios.create({
    // baseURL: process.env.API,
    withCredentials: true,
});

export default ({ app }) => {
    // Add a response interceptor
    api.interceptors.response.use(
        function (response) {
            // Any status code that lie within the range of 2xx cause this function to trigger
            // Do something with response data
            return response;
        },
        function (error) {
            const appState = useAppState();
            const validations = useServerValidations();
            const { t } = i18n.global;

            // Any status codes that falls outside the range of 2xx cause this function to trigger
            // Do something with response error

            // console.log(error)
            if (error.response.status === 401) {
                // Notify.create({
                //     color: "negative",
                //     icon: "error",
                //     message: t("unauthorized"),
                // });
                appState.guard = null;
                // return Promise.reject(error);
                // }
                // if (error.response.status === 403) {
                //     appState.guard = null;
                //     return Promise.reject(error);
            } else if (error.response.status == 422) {
                validations.errors = error.response.data.errors;
                return Promise.reject(error);
            } else if (error.response.status == 500) {
                alertError(error);
            } else {
                alertError(error);
                return Promise.reject(error);
            }
        }
    );
};

export { axios, api };
