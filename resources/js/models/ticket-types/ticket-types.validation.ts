import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { parseOptionalNonNegativeInt, zRequiredTrimmedString } from '../../validation/zod-fields';

export type Translator = (key: string) => string;

function createTicketTypeFormZodSchema(t: Translator) {
    return z
        .object({
            title: zRequiredTrimmedString(t('ticketTypesList.validationTitleRequired')),
            priceCents: z.preprocess(
                (v) => parseOptionalNonNegativeInt(v),
                z.union([z.number().int().min(0), z.null()]),
            ),
            isPayWhatYouCan: z.boolean(),
            minPerPurchase: z.preprocess((v) => {
                const n = parseOptionalNonNegativeInt(v);
                return n === null ? 0 : n;
            }, z.number().int().min(0)),
            maxPerPurchase: z.preprocess(
                (v) => parseOptionalNonNegativeInt(v),
                z.union([z.number().int().min(0), z.null()]),
            ),
        })
        .superRefine((data, ctx) => {
            if (data.maxPerPurchase !== null && data.maxPerPurchase < data.minPerPurchase) {
                ctx.addIssue({
                    code: 'custom',
                    message: t('ticketTypesList.validationMaxGteMin'),
                    path: ['maxPerPurchase'],
                });
            }
        });
}

export type TicketTypeFormValues = z.infer<ReturnType<typeof createTicketTypeFormZodSchema>>;

export function createTicketTypeFormSchema(t: Translator) {
    return toTypedSchema(createTicketTypeFormZodSchema(t));
}

/**
 * @returns {TicketTypeFormValues}
 */
export function createEmptyTicketTypeFormValues(): TicketTypeFormValues {
    return {
        title: '',
        priceCents: null,
        isPayWhatYouCan: false,
        minPerPurchase: 0,
        maxPerPurchase: null,
    };
}
