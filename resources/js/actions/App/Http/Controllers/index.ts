import Api from './Api'
import Auth from './Auth'
import AppServiceWorkerConfigController from './AppServiceWorkerConfigController'
import AppServiceWorkerScriptController from './AppServiceWorkerScriptController'

const Controllers = {
    Api: Object.assign(Api, Api),
    Auth: Object.assign(Auth, Auth),
    AppServiceWorkerConfigController: Object.assign(AppServiceWorkerConfigController, AppServiceWorkerConfigController),
    AppServiceWorkerScriptController: Object.assign(AppServiceWorkerScriptController, AppServiceWorkerScriptController),
}

export default Controllers