import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { parseOptionalNonNegativeInt, zRequiredTrimmedString } from '../../validation/zod-fields';

export type Translator = (key: string) => string;

type TicketTypeFormSchemaOptions = {
    editingTicketTypeId?: string | null;
};

function createTicketTypeFormZodSchema(t: Translator, options: TicketTypeFormSchemaOptions = {}) {
    const editingTicketTypeId = String(options.editingTicketTypeId ?? '').trim();

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
            dependsOnTicketTypeId: z.preprocess((v) => {
                if (v === null || v === undefined) {
                    return null;
                }
                const trimmed = String(v).trim();
                return trimmed.length > 0 ? trimmed : null;
            }, z.union([z.string().min(1), z.null()])),
            maxPerReferenceTicket: z.preprocess((v) => {
                if (v === '' || v === null || v === undefined) {
                    return null;
                }
                const n = parseOptionalNonNegativeInt(v);
                return n === null ? null : n;
            }, z.union([z.number().int().min(1), z.null()])),
        })
        .superRefine((data, ctx) => {
            if (data.maxPerPurchase !== null && data.maxPerPurchase < data.minPerPurchase) {
                ctx.addIssue({
                    code: 'custom',
                    message: t('ticketTypesList.validationMaxGteMin'),
                    path: ['maxPerPurchase'],
                });
            }

            const hasReference = data.dependsOnTicketTypeId !== null;
            const hasMaxPerReference = data.maxPerReferenceTicket !== null;

            if (hasReference !== hasMaxPerReference) {
                ctx.addIssue({
                    code: 'custom',
                    message: t('ticketTypesList.validationDependencyPairRequired'),
                    path: hasReference ? ['maxPerReferenceTicket'] : ['dependsOnTicketTypeId'],
                });
            }

            if (
                hasReference
                && editingTicketTypeId.length > 0
                && data.dependsOnTicketTypeId === editingTicketTypeId
            ) {
                ctx.addIssue({
                    code: 'custom',
                    message: t('ticketTypesList.validationDependencySelfReference'),
                    path: ['dependsOnTicketTypeId'],
                });
            }
        });
}

export type TicketTypeFormValues = z.infer<ReturnType<typeof createTicketTypeFormZodSchema>>;

export function createTicketTypeFormSchema(
    t: Translator,
    options: TicketTypeFormSchemaOptions = {},
) {
    return toTypedSchema(createTicketTypeFormZodSchema(t, options));
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
        dependsOnTicketTypeId: null,
        maxPerReferenceTicket: null,
    };
}
