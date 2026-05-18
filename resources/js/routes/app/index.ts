import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see routes/web.php:10
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
* @see routes/web.php:10
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
* @see routes/web.php:10
* @route '/app/invite/{token}'
*/
invite.get = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: invite.url(args, options),
    method: 'get',
})

/**
* @see routes/web.php:10
* @route '/app/invite/{token}'
*/
invite.head = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: invite.url(args, options),
    method: 'head',
})

/**
* @see routes/web.php:25
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
* @see routes/web.php:25
* @route '/app/setup'
*/
setup.url = (options?: RouteQueryOptions) => {
    return setup.definition.url + queryParams(options)
}

/**
* @see routes/web.php:25
* @route '/app/setup'
*/
setup.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: setup.url(options),
    method: 'get',
})

/**
* @see routes/web.php:25
* @route '/app/setup'
*/
setup.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: setup.url(options),
    method: 'head',
})

/**
* @see routes/web.php:33
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
* @see routes/web.php:33
* @route '/app/login'
*/
login.url = (options?: RouteQueryOptions) => {
    return login.definition.url + queryParams(options)
}

/**
* @see routes/web.php:33
* @route '/app/login'
*/
login.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(options),
    method: 'get',
})

/**
* @see routes/web.php:33
* @route '/app/login'
*/
login.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: login.url(options),
    method: 'head',
})

const app = {
    invite: Object.assign(invite, invite),
    setup: Object.assign(setup, setup),
    login: Object.assign(login, login),
}

export default app