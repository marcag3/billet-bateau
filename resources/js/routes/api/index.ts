import auth from './auth'
import powersync from './powersync'
import programs from './programs'

const api = {
    auth: Object.assign(auth, auth),
    powersync: Object.assign(powersync, powersync),
    programs: Object.assign(programs, programs),
}

export default api