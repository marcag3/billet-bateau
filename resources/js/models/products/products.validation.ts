import { isValid } from "ulid";
import { toTypedSchema } from "@vee-validate/zod";
import { z } from "zod";
import {
    coerceStringInput,
    parsePositiveInt,
    zRequiredTrimmedString,
} from "../../validation/zod-fields";

export type Translator = (key: string) => string;

const optionalUlidRefSchema = z.preprocess(
    (v) => (v == null || v === "" ? null : String(v)),
    z.union([z.string().refine((s) => isValid(s)), z.null()]),
);

function createProductUpsertFormZodSchema(t: Translator) {
    return z.object({
        name: zRequiredTrimmedString(t("productsList.nameRequired")),
        description: z.preprocess(coerceStringInput, z.string().trim()),
        capacity: z
            .preprocess(
                (v) => parsePositiveInt(v),
                z.union([z.number().int().min(1), z.null()]),
            )
            .refine((v): v is number => v !== null, {
                message: t("productsList.capacityRequired"),
            }),
        boatTypeId: optionalUlidRefSchema,
        waterRouteId: optionalUlidRefSchema,
    });
}

export type ProductUpsertFormValues = z.infer<
    ReturnType<typeof createProductUpsertFormZodSchema>
>;

export function createEmptyProductUpsertFormValues(): ProductUpsertFormValues {
    return {
        name: "",
        description: "",
        capacity: null,
        boatTypeId: null,
        waterRouteId: null,
    };
}

export function createProductUpsertFormSchema(t: Translator) {
    return toTypedSchema(createProductUpsertFormZodSchema(t));
}
