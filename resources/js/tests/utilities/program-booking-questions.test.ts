import { describe, expect, it } from 'vitest';
import {
    parseBookingTicketCustomFields,
    parseProgramBookingQuestions,
} from '../../utilities/program-booking-questions';

describe('program-booking-questions', () => {
    it('parseProgramBookingQuestions handles JSON text', () => {
        expect(parseProgramBookingQuestions('["Dietary restrictions?"]')).toEqual([
            'Dietary restrictions?',
        ]);
    });

    it('parseBookingTicketCustomFields handles JSON text', () => {
        expect(
            parseBookingTicketCustomFields(
                JSON.stringify({ 'Dietary restrictions?': 'None' }),
            ),
        ).toEqual({ 'Dietary restrictions?': 'None' });
    });

    it('parseBookingTicketCustomFields handles object input', () => {
        expect(
            parseBookingTicketCustomFields({ 'Shoe size': '42' }),
        ).toEqual({ 'Shoe size': '42' });
    });

    it('parseBookingTicketCustomFields returns empty object for invalid input', () => {
        expect(parseBookingTicketCustomFields(null)).toEqual({});
        expect(parseBookingTicketCustomFields('not-json')).toEqual({});
        expect(parseBookingTicketCustomFields('[]')).toEqual({});
    });
});
