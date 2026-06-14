import SessionController from './SessionController'
import ProfileController from './ProfileController'
import ProgramInvitationAcceptController from './ProgramInvitationAcceptController'
import InstallController from './InstallController'
import PasswordResetController from './PasswordResetController'

const Auth = {
    SessionController: Object.assign(SessionController, SessionController),
    ProfileController: Object.assign(ProfileController, ProfileController),
    ProgramInvitationAcceptController: Object.assign(ProgramInvitationAcceptController, ProgramInvitationAcceptController),
    InstallController: Object.assign(InstallController, InstallController),
    PasswordResetController: Object.assign(PasswordResetController, PasswordResetController),
}

export default Auth