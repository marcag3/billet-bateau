import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { Quasar } from 'quasar';
import lang from 'quasar/lang/en-US';
import { defineComponent, ref } from 'vue';
import PublicProgramDetailPage from '../../pages/PublicProgramDetailPage.vue';

const { fetchPublicJsonMock, postPublicJsonMock } = vi.hoisted(() => ({
    fetchPublicJsonMock: vi.fn(),
    postPublicJsonMock: vi.fn(),
}));

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        locale: { value: 'en-US' },
        t: (key: string, params?: Record<string, string>) => {
            if (key === 'publicBooking.successBody') {
                return `Booking ${params?.id} for ${params?.total} ticket(s).`;
            }
            if (key === 'publicBooking.successEmailSent') {
                return `Confirmation sent to ${params?.email}.`;
            }
            if (key === 'publicBooking.bookAnother') {
                return 'Book another trip';
            }
            if (key === 'publicBooking.priceFromCents') {
                return params?.amount ?? '';
            }
            return key;
        },
    }),
}));

vi.mock('../../services/publicApi', () => ({
    fetchPublicJson: fetchPublicJsonMock,
    postPublicJson: postPublicJsonMock,
    PublicApiRequestError: class PublicApiRequestError extends Error { },
}));

describe('PublicProgramDetailPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        fetchPublicJsonMock.mockImplementation(async (path: string) => {
            if (path.endsWith('/booking-options')) {
                return {
                    data: {
                        trips: [
                            {
                                id: 'trip-1',
                                scheduled_departure_at: '2026-02-01T10:00:00Z',
                                capacity: 10,
                                remaining_capacity: 10,
                                product_id: 'product-1',
                                product_name: 'Product',
                                product_description: null,
                                product_banner_url: null,
                                boat_type_id: null,
                                boat_type_name: null,
                                boat_type_banner_url: null,
                                water_route_id: null,
                                water_route_name: null,
                                water_route_duration_minutes: null,
                                water_route_trace_geojson: null,
                            },
                        ],
                        ticket_types: [
                            {
                                id: 'adult',
                                title: 'Adult',
                                price_cents: 2500,
                                is_pay_what_you_can: false,
                                min_per_purchase: 1,
                                max_per_purchase: null,
                            },
                        ],
                    },
                };
            }

            return {
                data: {
                    id: 'program-1',
                    name: 'Program One',
                    description: 'Desc',
                },
            };
        });

        postPublicJsonMock.mockResolvedValue({
            data: {
                id: 'booking-1',
                trip_id: 'trip-1',
                total_tickets: 2,
                contact_name: 'Jane',
                contact_email: 'jane@example.com',
            },
        });
    });

    it('shows booking success confirmation and allows booking another trip', async () => {
        const wrapper = mount(PublicProgramDetailPage, {
            props: {
                identifier: 'program-1',
            },
            global: {
                plugins: [[Quasar, { lang }]],
                stubs: {
                    QPage: {
                        template: '<div><slot /></div>',
                    },
                    QStepper: {
                        template: '<div><slot /></div>',
                    },
                    QStep: {
                        template: '<div><slot /></div>',
                    },
                    PublicProgramBookingTripStep: {
                        template:
                            '<button data-testid="trip-continue" @click="$emit(\'continue\', \'trip-1\')">Continue</button>',
                    },
                    PublicProgramBookingTicketsStep: true,
                    PublicProgramBookingContactStep: {
                        template: '<div />',
                    },
                },
            },
        });

        await flushPromises();

        (wrapper.vm as unknown as { createdBooking: unknown }).createdBooking = {
            id: 'booking-1',
            trip_id: 'trip-1',
            total_tickets: 2,
            contact_name: 'Jane',
            contact_email: 'jane@example.com',
        };
        await wrapper.vm.$nextTick();

        expect(wrapper.text()).toContain('Booking booking-1 for 2 ticket(s).');
        expect(wrapper.text()).toContain('Confirmation sent to jane@example.com.');
        expect(wrapper.text()).toContain('Book another trip');
    });

    it('keeps trip filters when returning to step 1', async () => {
        const TripStepStub = defineComponent({
            name: 'TripStepStub',
            emits: ['continue'],
            setup() {
                const selectedProductId = ref('');
                const selectedDateYmd = ref('');

                const setTripFilters = (): void => {
                    selectedProductId.value = 'product-1';
                    selectedDateYmd.value = '2026-02-01';
                };

                return {
                    selectedProductId,
                    selectedDateYmd,
                    setTripFilters,
                };
            },
            template: `
                <div>
                    <div data-testid="trip-filters">{{ selectedProductId }}|{{ selectedDateYmd }}</div>
                    <button
                        data-testid="set-trip-filters"
                        @click="setTripFilters"
                    >
                        Set trip filters
                    </button>
                    <button data-testid="trip-continue" @click="$emit('continue', 'trip-1')">
                        Continue
                    </button>
                </div>
            `,
        });

        const wrapper = mount(PublicProgramDetailPage, {
            props: {
                identifier: 'program-1',
            },
            global: {
                plugins: [[Quasar, { lang }]],
                stubs: {
                    QPage: {
                        template: '<div><slot /></div>',
                    },
                    QStepper: {
                        template: '<div><slot /></div>',
                    },
                    QStep: {
                        template: '<div><slot /></div>',
                    },
                    PublicProgramBookingTripStep: TripStepStub,
                    PublicProgramBookingTicketsStep: {
                        template: '<button data-testid="tickets-back" @click="$emit(\'back\')">Back</button>',
                    },
                    PublicProgramBookingContactStep: {
                        template: '<div />',
                    },
                },
            },
        });

        await flushPromises();

        await wrapper.get('[data-testid="set-trip-filters"]').trigger('click');
        expect(wrapper.get('[data-testid="trip-filters"]').text()).toBe('product-1|2026-02-01');

        await wrapper.get('[data-testid="trip-continue"]').trigger('click');
        await wrapper.get('[data-testid="tickets-back"]').trigger('click');
        await wrapper.vm.$nextTick();

        expect(wrapper.get('[data-testid="trip-filters"]').text()).toBe('product-1|2026-02-01');
    });
});
