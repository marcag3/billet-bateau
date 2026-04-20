import SessionController from './SessionController'
import InstallController from './InstallController'

const Auth = {
    SessionController: Object.assign(SessionController, SessionController),
    InstallController: Object.assign(InstallController, InstallController),
}

export default Auth