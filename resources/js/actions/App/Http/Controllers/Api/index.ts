import PublicProgramController from './PublicProgramController'
import PowerSyncCredentialsController from './PowerSyncCredentialsController'
import PowerSyncUploadController from './PowerSyncUploadController'
import ProgramController from './ProgramController'
import BoatTypeController from './BoatTypeController'

const Api = {
    PublicProgramController: Object.assign(PublicProgramController, PublicProgramController),
    PowerSyncCredentialsController: Object.assign(PowerSyncCredentialsController, PowerSyncCredentialsController),
    PowerSyncUploadController: Object.assign(PowerSyncUploadController, PowerSyncUploadController),
    ProgramController: Object.assign(ProgramController, ProgramController),
    BoatTypeController: Object.assign(BoatTypeController, BoatTypeController),
}

export default Api