import SessionController from './SessionController'
import ProgramInvitationAcceptController from './ProgramInvitationAcceptController'
import InstallController from './InstallController'

const Auth = {
    SessionController: Object.assign(SessionController, SessionController),
    ProgramInvitationAcceptController: Object.assign(ProgramInvitationAcceptController, ProgramInvitationAcceptController),
    InstallController: Object.assign(InstallController, InstallController),
}

export default Auth