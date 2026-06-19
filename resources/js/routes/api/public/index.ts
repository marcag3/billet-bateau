import programs from './programs'
import bookings from './bookings'

const publicMethod = {
    programs: Object.assign(programs, programs),
    bookings: Object.assign(bookings, bookings),
}

export default publicMethod