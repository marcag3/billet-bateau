import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { Quasar } from 'quasar';
import lang from 'quasar/lang/en-US';
import PublicProgramBookingTripStep from '../../components/public-program/PublicProgramBookingTripStep.vue';
import type { BookingTripOption } from '../../models/public-booking/public-booking.types';

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        locale: { value: 'en-US' },
        t: (key: string, params?: Record<string, string | number>) => {
            if (key === 'publicBooking.waterRouteDurationMinutes') {
                return `${params?.minutes} min`;
            }
            if (key === 'publicBooking.waterRouteDurationHoursOnly') {
                return `${params?.hours} h`;
            }
            if (key === 'publicBooking.waterRouteDurationHoursMinutes') {
                return `${params?.hours} h ${params?.minutes} min`;
            }
            if (key === 'publicBooking.unknownProduct') {
                return 'Unknown product';
            }
            return key;
        },
    }),
}));

function baseTrip(overrides: Partial<BookingTripOption> = {}): BookingTripOption {
    return {
        id: 'trip-1',
        scheduled_departure_at: '2026-06-15T14:00:00Z',
        capacity: 12,
        remaining_capacity: 8,
        product_id: 'product-1',
        product_name: 'Sunset cruise',
        product_description: null,
        product_banner_url: null,
        boat_type_id: null,
        boat_type_name: null,
        boat_type_banner_url: null,
        water_route_id: null,
        water_route_name: null,
        water_route_duration_minutes: null,
        water_route_trace_geojson: null,
        ...overrides,
    };
}

describe('PublicProgramBookingTripStep', () => {
    function mountStep(tripOptions: BookingTripOption[]) {
        return mount(PublicProgramBookingTripStep, {
            props: {
                tripOptions,
                programTimezone: 'America/Toronto',
                selectedProductId: '',
                selectedDateYmd: '',
                'onUpdate:selectedProductId': () => {},
                'onUpdate:selectedDateYmd': () => {},
            },
            global: {
                plugins: [[Quasar, { lang }]],
                stubs: {
                    PublicProgramBookingDateFilter: true,
                    PublicProgramProductFilterSelect: true,
                    QVirtualScroll: {
                        props: ['items'],
                        template: `
                            <table>
                                <slot name="before" />
                                <tbody>
                                    <template v-for="item in items" :key="item.id">
                                        <slot :item="item" />
                                    </template>
                                </tbody>
                            </table>
                        `,
                    },
                },
            },
        });
    }

    it('shows water route name and duration when present on the trip', () => {
        const wrapper = mountStep([
            baseTrip({
                water_route_id: 'route-1',
                water_route_name: 'River Loop',
                water_route_duration_minutes: 90,
            }),
        ]);

        expect(wrapper.text()).toContain('River Loop');
        expect(wrapper.text()).toContain('1 h 30 min');
        expect(wrapper.text()).toContain('Sunset cruise');
    });

    it('shows trip banner image when product banner url is set', () => {
        const wrapper = mountStep([
            baseTrip({
                product_banner_url: 'https://cdn.example/product.jpg',
            }),
        ]);

        const img = wrapper.findComponent({ name: 'QImg' });
        expect(img.exists()).toBe(true);
        expect(img.props('src')).toBe('https://cdn.example/product.jpg');
    });

    it('falls back to boat type banner when product banner is missing', () => {
        const wrapper = mountStep([
            baseTrip({
                boat_type_banner_url: 'https://cdn.example/boat.jpg',
            }),
        ]);

        const img = wrapper.findComponent({ name: 'QImg' });
        expect(img.exists()).toBe(true);
        expect(img.props('src')).toBe('https://cdn.example/boat.jpg');
    });
});
