import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../wayfinder'
/**
* @see routes/web.php:9
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
* @see routes/web.php:9
* @route '/app/setup'
*/
setup.url = (options?: RouteQueryOptions) => {
    return setup.definition.url + queryParams(options)
}

/**
* @see routes/web.php:9
* @route '/app/setup'
*/
setup.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: setup.url(options),
    method: 'get',
})

/**
* @see routes/web.php:9
* @route '/app/setup'
*/
setup.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: setup.url(options),
    method: 'head',
})

/**
* @see routes/web.php:17
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
* @see routes/web.php:17
* @route '/app/login'
*/
login.url = (options?: RouteQueryOptions) => {
    return login.definition.url + queryParams(options)
}

/**
* @see routes/web.php:17
* @route '/app/login'
*/
login.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: login.url(options),
    method: 'get',
})

/**
* @see routes/web.php:17
* @route '/app/login'
*/
login.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: login.url(options),
    method: 'head',
})

const app = {
    setup: Object.assign(setup, setup),
    login: Object.assign(login, login),
}

export default app