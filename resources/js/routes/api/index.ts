import auth from './auth'
import shapes from './shapes'

const api = {
    auth: Object.assign(auth, auth),
    shapes: Object.assign(shapes, shapes),
}

export default api