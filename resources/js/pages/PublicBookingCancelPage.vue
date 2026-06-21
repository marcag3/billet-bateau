<template>
    <q-page class="max-w-[560px] mx-auto p-4">
        <div v-if="loading" class="row justify-center p-8">
            <q-spinner color="primary" size="48px" />
        </div>

        <q-card v-else-if="cancelled" flat bordered class="bg-white">
            <q-card-section class="column items-center text-center gap-3 py-8">
                <q-icon name="check_circle" color="positive" size="52px" />
                <div class="text-h5 text-weight-bold text-dark">{{ t('publicBookingCancel.successTitle') }}</div>
                <p class="text-body1 text-dark mb-0">
                    {{ t('publicBookingCancel.successBody', { id: cancelled.id }) }}
                </p>
            </q-card-section>
        </q-card>

        <q-card v-else-if="preview !== null && preview.valid" flat bordered class="bg-white">
            <q-card-section class="row items-center gap-3 pb-2">
                <q-icon name="event_busy" color="negative" size="32px" />
                <h1 class="text-h5 text-weight-bold text-dark mb-0">{{ t('publicBookingCancel.title') }}</h1>
            </q-card-section>

            <q-separator />

            <q-card-section v-if="hasProductSummary" class="pb-0">
                <q-img
                    v-if="productBannerUrl != null"
                    :src="productBannerUrl"
                    :alt="preview.productName"
                    height="180px"
                    fit="cover"
                    class="rounded-borders mb-3"
                />
                <div v-if="preview.productName" class="text-subtitle1 text-weight-medium text-dark">
                    {{ preview.productName }}
                </div>
                <p
                    v-if="preview.productDescription"
                    class="text-body2 text-dark mb-0"
                    :class="{ 'mt-2': preview.productName.length > 0 }"
                >
                    {{ preview.productDescription }}
                </p>
            </q-card-section>

            <q-list separator class="px-2">
                <q-item>
                    <q-item-section>
                        <q-item-label class="text-caption text-weight-medium text-grey-9">
                            {{ t('publicBookingCancel.programLabel') }}
                        </q-item-label>
                        <q-item-label class="text-body1 text-dark">{{ preview.programName }}</q-item-label>
                    </q-item-section>
                </q-item>
                <q-item>
                    <q-item-section>
                        <q-item-label class="text-caption text-weight-medium text-grey-9">
                            {{ t('publicBookingCancel.departureLabel') }}
                        </q-item-label>
                        <q-item-label class="text-body1 text-dark whitespace-pre-line">
                            {{ preview.departureLabel }}
                        </q-item-label>
                    </q-item-section>
                </q-item>
                <q-item>
                    <q-item-section>
                        <q-item-label class="text-caption text-weight-medium text-grey-9">
                            {{ t('publicBookingCancel.ticketsLabel') }}
                        </q-item-label>
                        <q-item-label class="text-body1 text-dark">{{ preview.ticketSummary }}</q-item-label>
                    </q-item-section>
                </q-item>
                <q-item>
                    <q-item-section>
                        <q-item-label class="text-caption text-weight-medium text-grey-9">
                            {{ t('publicBookingCancel.referenceLabel') }}
                        </q-item-label>
                        <q-item-label class="text-body2 text-dark text-break-all">{{ preview.id }}</q-item-label>
                    </q-item-section>
                </q-item>
            </q-list>

            <q-card-section class="column gap-3 pt-2">
                <AppAlertBanner v-if="errorMessage" variant="error" class="mb-0">
                    {{ errorMessage }}
                </AppAlertBanner>

                <AppAlertBanner variant="warning" class="mb-0">
                    {{ t('publicBookingCancel.confirmHint') }}
                </AppAlertBanner>

                <q-btn
                    color="negative"
                    no-caps
                    class="full-width"
                    :label="t('publicBookingCancel.confirmButton')"
                    :loading="isSubmitting"
                    :disable="isSubmitting"
                    @click="onConfirmCancel"
                />
                <q-btn
                    flat
                    no-caps
                    color="primary"
                    class="full-width"
                    :label="t('publicBookingCancel.keepBooking')"
                    :disable="isSubmitting"
                    @click="onKeepBooking"
                />
            </q-card-section>
        </q-card>

        <q-card v-else flat bordered class="bg-white">
            <q-card-section class="column items-center text-center gap-3 py-8">
                <q-icon name="error_outline" color="negative" size="48px" />
                <AppAlertBanner variant="error" class="mb-0 full-width">
                    {{ errorMessage || t('publicBookingCancel.loadFailed') }}
                </AppAlertBanner>
            </q-card-section>
        </q-card>
    </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import AppAlertBanner from '../components/ui/AppAlertBanner.vue';
import { pickTripBannerUrl } from '../utilities/public-booking-trip-display';
import {
    cancel as cancelBooking,
    show as cancelPreview,
} from '../actions/App/Http/Controllers/Api/PublicBookingCancelController';
import {
    fetchPublicJson,
    postPublicJson,
    PublicApiRequestError,
} from '../services/publicApi';
import { formatDepartureLabel } from '../utilities/program-timezone-datetime';

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();

const loading = ref(true);
const errorMessage = ref('');
const isSubmitting = ref(false);
const cancelled = ref<{ id: string } | null>(null);

const token = computed(() => String(route.params.token ?? '').trim());

type CancelPreview =
    | {
          valid: true;
          id: string;
          programName: string;
          productName: string;
          productDescription: string;
          productBannerUrl: string | null;
          boatTypeBannerUrl: string | null;
          departureLabel: string;
          ticketSummary: string;
      }
    | { valid: false; reason: string };

const preview = ref<CancelPreview | null>(null);

const productBannerUrl = computed((): string | null => {
    if (preview.value === null || !preview.value.valid) {
        return null;
    }

    return pickTripBannerUrl({
        product_banner_url: preview.value.productBannerUrl,
        boat_type_banner_url: preview.value.boatTypeBannerUrl,
    });
});

const hasProductSummary = computed((): boolean => {
    if (preview.value === null || !preview.value.valid) {
        return false;
    }

    return (
        preview.value.productName.length > 0
        || preview.value.productDescription.length > 0
        || productBannerUrl.value != null
    );
});

function formatDeparture(iso: string, timezone: string): string {
    if (iso.trim().length === 0) {
        return '—';
    }

    return formatDepartureLabel(iso, timezone, String(locale.value));
}

function reasonToMessage(reason: string): string {
    if (reason === 'past_departure') {
        return t('publicBookingCancel.pastDeparture');
    }
    if (reason === 'checked_in') {
        return t('publicBookingCancel.checkedIn');
    }
    if (reason === 'voyage_started') {
        return t('publicBookingCancel.voyageStarted');
    }
    return t('publicBookingCancel.invalidLink');
}

async function loadPreview(): Promise<void> {
    loading.value = true;
    errorMessage.value = '';
    preview.value = null;

    const tkn = token.value;
    if (tkn.length !== 64) {
        errorMessage.value = t('publicBookingCancel.invalidLink');
        loading.value = false;
        return;
    }

    try {
        const payload = (await fetchPublicJson(cancelPreview.url(tkn))) as {
            valid?: boolean;
            reason?: string;
            data?: Record<string, unknown>;
        };

        if (payload.valid !== true) {
            const reason = String(payload.reason ?? 'invalid');
            errorMessage.value = reasonToMessage(reason);
            preview.value = { valid: false, reason };
            return;
        }

        const data = payload.data ?? {};
        preview.value = {
            valid: true,
            id: String(data.id ?? ''),
            programName: String(data.program_name ?? ''),
            productName: String(data.product_name ?? ''),
            productDescription: String(data.product_description ?? ''),
            productBannerUrl: data.product_banner_url != null ? String(data.product_banner_url) : null,
            boatTypeBannerUrl: data.boat_type_banner_url != null ? String(data.boat_type_banner_url) : null,
            departureLabel: formatDeparture(
                String(data.departure_at ?? ''),
                String(data.timezone ?? 'America/Toronto'),
            ),
            ticketSummary: String(data.ticket_summary ?? ''),
        };
    } catch {
        errorMessage.value = t('publicBookingCancel.loadFailed');
    } finally {
        loading.value = false;
    }
}

function onKeepBooking(): void {
    if (window.history.length > 1) {
        router.back();
        return;
    }

    void router.push({ name: 'public.home' });
}

async function onConfirmCancel(): Promise<void> {
    const tkn = token.value;
    if (tkn.length !== 64 || preview.value === null || !preview.value.valid) {
        return;
    }

    errorMessage.value = '';
    isSubmitting.value = true;

    try {
        const payload = (await postPublicJson(cancelBooking.url(tkn), {})) as {
            data?: Record<string, unknown>;
        };
        const data = payload.data ?? {};
        cancelled.value = {
            id: String(data.id ?? preview.value.id),
        };
    } catch (error) {
        if (error instanceof PublicApiRequestError) {
            errorMessage.value =
                error.message.length > 0 ? error.message : t('publicBookingCancel.cancelFailed');
        } else {
            errorMessage.value = t('publicBookingCancel.cancelFailed');
        }
    } finally {
        isSubmitting.value = false;
    }
}

onMounted(() => {
    void loadPreview();
});

watch(token, () => {
    void loadPreview();
});
</script>
