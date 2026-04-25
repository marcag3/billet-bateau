import Api from './Api'
import Auth from './Auth'

const Controllers = {
    Api: Object.assign(Api, Api),
    Auth: Object.assign(Auth, Auth),
}

export default Controllers