import PublicProgramController from './PublicProgramController'
import PowerSyncCredentialsController from './PowerSyncCredentialsController'
import PowerSyncUploadController from './PowerSyncUploadController'
import ProgramController from './ProgramController'
import PresignUploadController from './PresignUploadController'

const Api = {
    PublicProgramController: Object.assign(PublicProgramController, PublicProgramController),
    PowerSyncCredentialsController: Object.assign(PowerSyncCredentialsController, PowerSyncCredentialsController),
    PowerSyncUploadController: Object.assign(PowerSyncUploadController, PowerSyncUploadController),
    ProgramController: Object.assign(ProgramController, ProgramController),
    PresignUploadController: Object.assign(PresignUploadController, PresignUploadController),
}

export default Api