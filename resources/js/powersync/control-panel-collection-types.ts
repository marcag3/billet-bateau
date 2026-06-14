import type { createTripsCollection } from './trips.collection';
import type { createProductsCollection } from './products.collection';
import type { createBoatTypesCollection } from './boat-types.collection';
import type { createWaterRoutesCollection } from './water-routes.collection';
import type { createVoyagesCollection } from './voyages.collection';
import type { createPassengersCollection } from './passengers.collection';
import type { createBookingsCollection } from './bookings.collection';
import type { createBookingTicketsCollection } from './booking-tickets.collection';
import type { createVoyageBoatCollection } from './voyage-boat.collection';
import type { createVoyageGuideCollection } from './voyage-guide.collection';
import type { createCheckInsCollection } from './check-ins.collection';

export type ControlPanelQueryCollections = {
    trips: ReturnType<typeof createTripsCollection>;
    products: ReturnType<typeof createProductsCollection>;
    boat_types: ReturnType<typeof createBoatTypesCollection>;
    water_routes: ReturnType<typeof createWaterRoutesCollection>;
    voyages: ReturnType<typeof createVoyagesCollection>;
    passengers: ReturnType<typeof createPassengersCollection>;
    bookings: ReturnType<typeof createBookingsCollection>;
    booking_tickets: ReturnType<typeof createBookingTicketsCollection>;
    voyage_boat: ReturnType<typeof createVoyageBoatCollection>;
    voyage_guide: ReturnType<typeof createVoyageGuideCollection>;
    check_ins: ReturnType<typeof createCheckInsCollection>;
};
