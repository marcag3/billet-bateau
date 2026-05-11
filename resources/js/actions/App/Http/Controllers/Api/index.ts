import PublicProgramController from './PublicProgramController'
import PublicBookingController from './PublicBookingController'
import PowerSyncCredentialsController from './PowerSyncCredentialsController'
import PowerSyncUploadController from './PowerSyncUploadController'
import ProgramController from './ProgramController'
import PresignUploadController from './PresignUploadController'

const Api = {
    PublicProgramController: Object.assign(PublicProgramController, PublicProgramController),
    PublicBookingController: Object.assign(PublicBookingController, PublicBookingController),
    PowerSyncCredentialsController: Object.assign(PowerSyncCredentialsController, PowerSyncCredentialsController),
    PowerSyncUploadController: Object.assign(PowerSyncUploadController, PowerSyncUploadController),
    ProgramController: Object.assign(ProgramController, ProgramController),
    PresignUploadController: Object.assign(PresignUploadController, PresignUploadController),
}

export default Api