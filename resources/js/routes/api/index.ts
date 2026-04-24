import auth from './auth'
import powersync from './powersync'

const api = {
    auth: Object.assign(auth, auth),
    powersync: Object.assign(powersync, powersync),
}

export default api