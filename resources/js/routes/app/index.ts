import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\AppServiceWorkerConfigController::__invoke
* @see app/Http/Controllers/AppServiceWorkerConfigController.php:12
* @route '/app/sw-config.json'
*/
export const swConfig = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: swConfig.url(options),
    method: 'get',
})

swConfig.definition = {
    methods: ["get","head"],
    url: '/app/sw-config.json',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AppServiceWorkerConfigController::__invoke
* @see app/Http/Controllers/AppServiceWorkerConfigController.php:12
* @route '/app/sw-config.json'
*/
swConfig.url = (options?: RouteQueryOptions) => {
    return swConfig.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AppServiceWorkerConfigController::__invoke
* @see app/Http/Controllers/AppServiceWorkerConfigController.php:12
* @route '/app/sw-config.json'
*/
swConfig.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: swConfig.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppServiceWorkerConfigController::__invoke
* @see app/Http/Controllers/AppServiceWorkerConfigController.php:12
* @route '/app/sw-config.json'
*/
swConfig.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: swConfig.url(options),
    method: 'head',
})

/**
* @see routes/web.php:15
* @route '/app/invite/{token}'
*/
export const invite = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: invite.url(args, options),
    method: 'get',
})

invite.definition = {
    methods: ["get","head"],
    url: '/app/invite/{token}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:15
* @route '/app/invite/{token}'
*/
invite.url = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { token: args }
    }

    if (Array.isArray(args)) {
        args = {
            token: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        token: args.token,
    }

    return invite.definition.url
            .replace('{token}', parsedArgs.token.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see routes/web.php:15
* @route '/app/invite/{token}'
*/
invite.get = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: invite.url(args, options),
    method: 'get',
})

/**
* @see routes/web.php:15
* @route '/app/invite/{token}'
*/
invite.head = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: invite.url(args, options),
    method: 'head',
})

/**
* @see routes/web.php:30
* @route '/app/setup'
*/
export const setup = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: setup.url(options),
    method: 'get',
})

setup.definition = {
    methods: ["get","head"],
    url: '/app/setup',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:30
* @route '/app/setup'
*/
setup.url = (options?: RouteQueryOptions) => {
    return setup.definition.url + queryParams(options)
}

/**
* @see routes/web.php:30
* @route '/app/setup'
*/
setup.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: setup.url(options),
    method: 'get',
})

/**
* @see routes/web.php:30
* @route '/app/setup'
*/
setup.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: setup.url(options),
    method: 'head',
})

/**
* @see routes/web.php:38
* @route '/app/login'
*/
export const login = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(options),
    method: 'get',
})

login.definition = {
    methods: ["get","head"],
    url: '/app/login',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:38
* @route '/app/login'
*/
login.url = (options?: RouteQueryOptions) => {
    return login.definition.url + queryParams(options)
}

/**
* @see routes/web.php:38
* @route '/app/login'
*/
login.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(options),
    method: 'get',
})

/**
* @see routes/web.php:38
* @route '/app/login'
*/
login.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: login.url(options),
    method: 'head',
})

/**
* @see routes/web.php:42
* @route '/app/forgot-password'
*/
export const forgotPassword = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: forgotPassword.url(options),
    method: 'get',
})

forgotPassword.definition = {
    methods: ["get","head"],
    url: '/app/forgot-password',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:42
* @route '/app/forgot-password'
*/
forgotPassword.url = (options?: RouteQueryOptions) => {
    return forgotPassword.definition.url + queryParams(options)
}

/**
* @see routes/web.php:42
* @route '/app/forgot-password'
*/
forgotPassword.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: forgotPassword.url(options),
    method: 'get',
})

/**
* @see routes/web.php:42
* @route '/app/forgot-password'
*/
forgotPassword.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: forgotPassword.url(options),
    method: 'head',
})

/**
* @see routes/web.php:46
* @route '/app/reset-password'
*/
export const resetPassword = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: resetPassword.url(options),
    method: 'get',
})

resetPassword.definition = {
    methods: ["get","head"],
    url: '/app/reset-password',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:46
* @route '/app/reset-password'
*/
resetPassword.url = (options?: RouteQueryOptions) => {
    return resetPassword.definition.url + queryParams(options)
}

/**
* @see routes/web.php:46
* @route '/app/reset-password'
*/
resetPassword.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: resetPassword.url(options),
    method: 'get',
})

/**
* @see routes/web.php:46
* @route '/app/reset-password'
*/
resetPassword.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: resetPassword.url(options),
    method: 'head',
})

const app = {
    swConfig: Object.assign(swConfig, swConfig),
    invite: Object.assign(invite, invite),
    setup: Object.assign(setup, setup),
    login: Object.assign(login, login),
    forgotPassword: Object.assign(forgotPassword, forgotPassword),
    resetPassword: Object.assign(resetPassword, resetPassword),
}

export default app