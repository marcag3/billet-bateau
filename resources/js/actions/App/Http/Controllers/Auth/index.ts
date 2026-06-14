import SessionController from './SessionController'
import ProgramInvitationAcceptController from './ProgramInvitationAcceptController'
import InstallController from './InstallController'
import PasswordResetController from './PasswordResetController'

const Auth = {
    SessionController: Object.assign(SessionController, SessionController),
    ProgramInvitationAcceptController: Object.assign(ProgramInvitationAcceptController, ProgramInvitationAcceptController),
    InstallController: Object.assign(InstallController, InstallController),
    PasswordResetController: Object.assign(PasswordResetController, PasswordResetController),
}

export default Auth