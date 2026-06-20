import SessionController from './SessionController'
import ProfileController from './ProfileController'
import ProgramInvitationAcceptController from './ProgramInvitationAcceptController'
import InstallController from './InstallController'
import GoogleOAuthController from './GoogleOAuthController'
import PasswordResetController from './PasswordResetController'

const Auth = {
    SessionController: Object.assign(SessionController, SessionController),
    ProfileController: Object.assign(ProfileController, ProfileController),
    ProgramInvitationAcceptController: Object.assign(ProgramInvitationAcceptController, ProgramInvitationAcceptController),
    InstallController: Object.assign(InstallController, InstallController),
    GoogleOAuthController: Object.assign(GoogleOAuthController, GoogleOAuthController),
    PasswordResetController: Object.assign(PasswordResetController, PasswordResetController),
}

export default Auth