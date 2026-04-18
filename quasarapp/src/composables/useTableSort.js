import { isDate, isNumber } from "lodash";
import { computed } from "vue";

export function useTableSort(colList) {
    const computedSortMethod = computed(() => (data, sortBy, descending) => {
        const col = colList.value.find((def) => def.name === sortBy);
        if (col === void 0 || col.field === void 0) {
            return data;
        }

        const dir = descending === true ? -1 : 1,
            val = typeof col.field === "function" ? (v) => col.field(v) : (v) => v[col.field];

        return data.sort((a, b) => {
            let A = val(a),
                B = val(b);

            if (A === null || A === void 0) {
                return -1 * dir;
            }
            if (B === null || B === void 0) {
                return 1 * dir;
            }
            if (col.sort !== void 0) {
                return col.sort(A, B, a, b) * dir;
            }
            if (isNumber(A) === true && isNumber(B) === true) {
                return (A - B) * dir;
            }
            if (isDate(A) === true && isDate(B) === true) {
                return (new Date(A) - new Date(B)) * dir;
            }
            if (typeof A === "boolean" && typeof B === "boolean") {
                return (A - B) * dir;
            }

            [A, B] = [A, B].map((s) => (s + "").toLocaleString().toLowerCase());

            return A < B ? -1 * dir : A === B ? 0 : dir;
        });
    });

    return {
        computedSortMethod,
    };
}
