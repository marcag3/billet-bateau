import publicMethod from './public'
import auth from './auth'
import powersync from './powersync'
import programs from './programs'
import boatTypes from './boat-types'

const api = {
    public: Object.assign(publicMethod, publicMethod),
    auth: Object.assign(auth, auth),
    powersync: Object.assign(powersync, powersync),
    programs: Object.assign(programs, programs),
    boatTypes: Object.assign(boatTypes, boatTypes),
}

export default api