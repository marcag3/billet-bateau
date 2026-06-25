import type { BookingTicketTypeOption } from '../models/public-booking/public-booking.types';

export function formatTicketTypePrice(
    tt: BookingTicketTypeOption,
    locale: string,
    t: (key: string, params?: Record<string, string>) => string,
): string {
    if (tt.is_pay_what_you_can) {
        return t('publicBooking.payWhatYouCan');
    }
    if (tt.price_cents == null) {
        return '—';
    }
    const amount = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(tt.price_cents / 100);
    return t('publicBooking.priceFromCents', { amount });
}
