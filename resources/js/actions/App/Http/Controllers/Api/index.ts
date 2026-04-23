import PowerSyncCredentialsController from './PowerSyncCredentialsController'
import PowerSyncUploadController from './PowerSyncUploadController'
import TodoController from './TodoController'

const Api = {
    PowerSyncCredentialsController: Object.assign(PowerSyncCredentialsController, PowerSyncCredentialsController),
    PowerSyncUploadController: Object.assign(PowerSyncUploadController, PowerSyncUploadController),
    TodoController: Object.assign(TodoController, TodoController),
}

export default Api