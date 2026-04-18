import { api } from "boot/axios";
import { ref } from "@vue/reactivity";
import { alertError, normalize, operators } from "../utilities/helpers";
import { i18n } from "boot/i18n";
import { Notify } from "quasar";
import { useAppState } from "./appState";
import { date } from "quasar";

const { t } = i18n.global;

export function url(store) {
    if (useAppState().authGuard === "client") {
        return useAppState().routePrefix + (store.clientUrl ?? store.url);
    }
    return useAppState().routePrefix + store.url;
}

export function formatParameters(parameters) {
    return parameters !== undefined
        ? "?" +
              Object.entries(parameters)
                  .map((entry) => entry.join("="))
                  .join("&")
        : "";
}

export function defaultState({ store }) {
    if (store.class === undefined) return;
    const properties = [
        { name: "list", value: [] },
        { name: "selected", value: [] },
        { name: "isLoading", value: false },
        { name: "updatedOn", value: null },
        { name: "current", value: new store.class() },
    ];

    for (let property of properties) {
        if (store[property.name] === undefined) {
            const propertyRef = ref(property.value);
            store[property.name] = propertyRef;
            store.$state[property.name] = propertyRef;
        }
    }
}

async function updateRelatedDispatch(model, store) {
    if (store.updateRelated) return store.updateRelated(model);
}

function updateModelInList(modelData, store) {
    const newModel = new store.class(modelData);
    const modelIndex = store.list.findIndex((item) => item.primaryKey === newModel.primaryKey);
    if (modelIndex == -1) {
        store.list.push(newModel);
    } else {
        store.list[modelIndex] = newModel;
    }
    return newModel;
}
function replaceList(data, store) {
    store.list = [];
    if (data.length > 0) {
        for (let modelData of data) {
            store.list.push(new store.class(modelData));
        }
    }
}

export function defaultActions({ store }) {
    if (store.class === undefined) return;
    return {
        async getIndexDebounce() {
            if (store.updatedOn === null || date.getDateDiff(store.updatedOn, new Date(), "minutes") > 5) {
                await store.getIndex();
            }
            // return true;
        },

        filteredList(filters, needle = "") {
            needle = needle.toLowerCase();
            return store.list.filter((item) => {
                //filter from needle
                if (
                    needle &&
                    needle.length > 0 &&
                    (item["displayName"] === null ||
                        item["displayName"] === undefined ||
                        normalize(item["displayName"]).indexOf(needle) === -1)
                )
                    return false;

                //filter from filters property
                for (let key in filters) {
                    let filterFunction = filters[key].filterFunction;
                    let path = filters[key].path;
                    let operator = filters[key].operator ?? "===";
                    let value = filters[key].value;
                    const itemValue = typeof path === "function" ? path(item) : _.get(item, path);
                    //remove item if a filter is defined and the property is undefined
                    //or if the property does not pass the filter test
                    if (filterFunction !== undefined) {
                        if (!filterFunction(item)) return false;
                    } else if (
                        itemValue === undefined ||
                        !operators[operator](normalize(itemValue), normalize(value))
                    ) {
                        // console.log(key, itemValue, operator, value);
                        return false;
                    }
                }

                return true;
            });
        },

        camelCaseName: _.camelCase(store.className),
        pascalCaseName: _.startCase(_.camelCase(store.className)).replace(/ /g, ""),
        snakeCaseName: _.snakeCase(store.className),
        getSelectedString() {
            return store.selected.length === 0
                ? ""
                : store.selected.length +
                      " " +
                      t(store.camelCaseName, store.selected.length) +
                      " " +
                      t("selected_of", store.selected.length) +
                      " " +
                      store.list.length;
        },

        getIndex(filters) {
            //get request to index endpoint to list the resources
            store.isLoading = true;
            return new Promise((resolve, reject) => {
                api.get(url(store) + formatParameters(filters))
                    .then((response) => {
                        store.updatedOn = new Date();
                        const data = response.data.data;

                        if (filters) {
                            data.forEach((modelData) => updateModelInList(modelData, store));
                        } else {
                            replaceList(data, store);
                        }
                        store.updateLists();
                        store.isLoading = false;
                        resolve(response);
                    })
                    .catch((error) => {
                        store.isLoading = false;
                        alertError(error);
                        reject(error);
                    });
            });
        },

        showCurrent(primaryKey = undefined) {
            //set current to primaryKey and load all informations for current object or refresh
            if (!store.current.primaryKey && primaryKey === undefined) return;
            if (primaryKey === null) {
                store.current = new store.class();
                return;
            }
            if (primaryKey) store.current = new store.class({ [store.class.PRIMARY_KEY_NAME]: primaryKey });
            return store.show(store.current);
        },

        show(model) {
            if (!model) return;
            store.isLoading = true;
            return new Promise((resolve, reject) => {
                api.get(url(store) + "/" + model.primaryKey)
                    .then(async (response) => {
                        const data = response.data.data;
                        const updatedModel = updateModelInList(data, store);
                        await store.updateLists();
                        store.isLoading = false;
                        // await updateRelatedDispatch(store.list[modelIndex], store);
                        resolve(updatedModel);
                    })
                    .catch((error) => {
                        store.isLoading = false;
                        // alertError(error);
                        reject(error);
                    });
            });
        },

        async updateLists() {
            //update the selected model list to remove deleted model and update modified model
            store.selected = store.list.filter((item) =>
                store.selected.map((selected) => selected.primaryKey).includes(item.primaryKey)
            );

            if (store.current && store.current.primaryKey) {
                store.current = new store.class(store.find(store.current.primaryKey));
            }
        },

        storeCurrent() {
            store.store(store.current).then((storedObject) => (store.current = storedObject));
        },

        store(model) {
            store.isLoading = true;
            return new Promise((resolve, reject) => {
                api.post(url(store), model.formatToSend())
                    .then(async (response) => {
                        //some endpoint uses api resource and some don't
                        let data = [];
                        if ("data" in response.data) data = response.data.data;
                        else data = response.data;

                        const newObject = new store.class(data);
                        store.list.push(newObject);
                        await store.updateLists();
                        store.isLoading = false;
                        updateRelatedDispatch(newObject, store);
                        resolve(newObject);
                    })
                    .catch((error) => {
                        store.isLoading = false;
                        reject(error);
                    });
            });
        },

        updateCurrent() {
            if (!store.current.id) return;
            return store.update(store.current);
        },

        update(model) {
            store.isLoading = true;
            return new Promise((resolve, reject) => {
                const data = model.formatToSend();
                if (data instanceof FormData) {
                    data.append("_method", "patch");
                } else {
                    data["_method"] = "patch";
                }

                api.post(url(store) + "/" + model.primaryKey, data)
                    .then(async (response) => {
                        const modelIndex = store.list.findIndex((item) => item.primaryKey === model.primaryKey);

                        //some endpoint uses api resource and some don't
                        let data = [];
                        if ("data" in response.data) data = response.data.data;
                        else data = response.data;

                        store.list[modelIndex] = new store.class(data);
                        await store.updateLists();
                        store.isLoading = false;
                        updateRelatedDispatch(store.list[modelIndex], store);
                        resolve(store.list[modelIndex]);
                    })
                    .catch((error) => {
                        store.isLoading = false;
                        // alertError(error);
                        reject(error);
                    });
            });
        },

        async updateSelected() {
            const requests = [];
            for (let model of store.selected) {
                requests.push(store.update(model));
            }
            await Promise.all(requests);
            Notify.create({
                color: "positive",
                icon: "cloud_done",
                message: t("saved"),
            });
        },

        delete(model) {
            store.isLoading = true;
            return new Promise((resolve, reject) => {
                api.delete(url(store) + "/" + model.primaryKey)
                    .then(async (response) => {
                        await updateRelatedDispatch(model, store);
                        const index = store.list.findIndex((item) => item.primaryKey === model.primaryKey);
                        store.list.splice(index, 1);
                        store.updateLists();
                        store.isLoading = false;
                        resolve(response);
                    })
                    .catch((error) => {
                        store.isLoading = false;
                        alertError(error);
                        reject(error);
                    });
            });
        },

        async deleteSelected() {
            const requests = [];
            for (let model of store.selected) {
                requests.push(store.delete(model));
            }
            await Promise.all(requests).then(() => {
                Notify.create({
                    color: "positive",
                    icon: "cloud_done",
                    message: t("deleted"),
                });
            });
        },

        find(primaryKey) {
            let model = store.list.find((model) => model.primaryKey === primaryKey) ?? new store.class();
            return model;
        },
    };
}
