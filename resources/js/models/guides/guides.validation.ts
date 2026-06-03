import { toTypedSchema } from '@vee-validate/zod';
import { z } from 'zod';
import { zRequiredTrimmedString } from '../../validation/zod-fields';

export type Translator = (key: string) => string;

function createGuideFormZodSchema(t: Translator) {
    return z.object({
        name: zRequiredTrimmedString(t('guidesList.nameRequired')),
    });
}

export type GuideFormValues = z.infer<ReturnType<typeof createGuideFormZodSchema>>;

export function createEmptyGuideFormValues(): GuideFormValues {
    return {
        name: '',
    };
}

export function createGuideFormSchema(t: Translator) {
    return toTypedSchema(createGuideFormZodSchema(t));
}
