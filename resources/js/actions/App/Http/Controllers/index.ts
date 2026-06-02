import Api from './Api'
import Auth from './Auth'
import AppServiceWorkerConfigController from './AppServiceWorkerConfigController'

const Controllers = {
    Api: Object.assign(Api, Api),
    Auth: Object.assign(Auth, Auth),
    AppServiceWorkerConfigController: Object.assign(AppServiceWorkerConfigController, AppServiceWorkerConfigController),
}

export default Controllers