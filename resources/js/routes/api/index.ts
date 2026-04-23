import auth from './auth'
import _cursor_debug from './_cursor_debug'
import powersync from './powersync'

const api = {
    auth: Object.assign(auth, auth),
    _cursor_debug: Object.assign(_cursor_debug, _cursor_debug),
    powersync: Object.assign(powersync, powersync),
}

export default api