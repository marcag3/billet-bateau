import PublicProgramController from './PublicProgramController'
import PowerSyncCredentialsController from './PowerSyncCredentialsController'
import PowerSyncUploadController from './PowerSyncUploadController'
import TodoController from './TodoController'
import ProgramController from './ProgramController'

const Api = {
    PublicProgramController: Object.assign(PublicProgramController, PublicProgramController),
    PowerSyncCredentialsController: Object.assign(PowerSyncCredentialsController, PowerSyncCredentialsController),
    PowerSyncUploadController: Object.assign(PowerSyncUploadController, PowerSyncUploadController),
    TodoController: Object.assign(TodoController, TodoController),
    ProgramController: Object.assign(ProgramController, ProgramController),
}

export default Api