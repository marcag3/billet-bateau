import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { Quasar } from 'quasar';
import lang from 'quasar/lang/en-US';
import PublicProgramBookingTicketsStep from '../../components/public-program/PublicProgramBookingTicketsStep.vue';

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (key: string) => key,
    }),
}));

describe('PublicProgramBookingTicketsStep', () => {
    const ticketTypeOptions = [
        {
            id: 'adult',
            title: 'Adult',
            price_cents: 2500,
            is_pay_what_you_can: false,
            min_per_purchase: 1,
            max_per_purchase: null,
        },
    ];

    function mountStep() {
        return mount(PublicProgramBookingTicketsStep, {
            props: {
                ticketTypeOptions,
                formatTicketTypePrice: () => '$25.00',
                canContinue: false,
                ticketErrors: {
                    adult: 'selectionner au moins un billet',
                },
                ticketQuantities: {
                    adult: 0,
                },
                'onUpdate:ticketQuantities': () => { },
            },
            global: {
                plugins: [[Quasar, { lang }]],
            },
        });
    }

    it('shows ticket error only after blur or plus-minus interaction', async () => {
        const wrapper = mountStep();
        const qInput = wrapper.findComponent({ name: 'QInput' });

        expect(qInput.props('error')).toBe(false);
        expect(qInput.props('errorMessage')).toBe('');

        qInput.vm.$emit('blur');
        await wrapper.vm.$nextTick();

        expect(qInput.props('error')).toBe(true);
        expect(qInput.props('errorMessage')).toBe('selectionner au moins un billet');

        const secondWrapper = mountStep();
        const secondInput = secondWrapper.findComponent({ name: 'QInput' });
        const plusButton = secondWrapper
            .findAllComponents({ name: 'QBtn' })
            .find((button) => String(button.props('icon')) === 'add');

        expect(secondInput.props('error')).toBe(false);
        expect(secondInput.props('errorMessage')).toBe('');
        expect(plusButton).toBeDefined();

        await plusButton!.trigger('click');

        expect(secondInput.props('error')).toBe(true);
        expect(secondInput.props('errorMessage')).toBe('selectionner au moins un billet');
    });
});
