import Auth from './Auth'
import Api from './Api'

const Controllers = {
    Auth: Object.assign(Auth, Auth),
    Api: Object.assign(Api, Api),
}

export default Controllers