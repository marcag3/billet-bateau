import SessionController from './SessionController'
import InstallController from './InstallController'
import ProgramInvitationAcceptController from './ProgramInvitationAcceptController'

const Auth = {
    SessionController: Object.assign(SessionController, SessionController),
    InstallController: Object.assign(InstallController, InstallController),
    ProgramInvitationAcceptController: Object.assign(
        ProgramInvitationAcceptController,
        ProgramInvitationAcceptController,
    ),
}

export default Auth