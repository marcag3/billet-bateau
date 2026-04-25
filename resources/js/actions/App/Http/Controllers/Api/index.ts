import PublicProgramController from './PublicProgramController'
import PowerSyncCredentialsController from './PowerSyncCredentialsController'
import PowerSyncUploadController from './PowerSyncUploadController'
import ProgramController from './ProgramController'
import MediaController from './MediaController'

const Api = {
    PublicProgramController: Object.assign(PublicProgramController, PublicProgramController),
    PowerSyncCredentialsController: Object.assign(PowerSyncCredentialsController, PowerSyncCredentialsController),
    PowerSyncUploadController: Object.assign(PowerSyncUploadController, PowerSyncUploadController),
    ProgramController: Object.assign(ProgramController, ProgramController),
    MediaController: Object.assign(MediaController, MediaController),
}

export default Api