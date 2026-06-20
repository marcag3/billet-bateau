import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
import profile from './profile'
import password from './password'
/**
* @see \App\Http\Controllers\Auth\SessionController::me
* @see app/Http/Controllers/Auth/SessionController.php:46
* @route '/api/auth/me'
*/
export const me = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: me.url(options),
    method: 'get',
})

me.definition = {
    methods: ["get","head"],
    url: '/api/auth/me',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\SessionController::me
* @see app/Http/Controllers/Auth/SessionController.php:46
* @route '/api/auth/me'
*/
me.url = (options?: RouteQueryOptions) => {
    return me.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\SessionController::me
* @see app/Http/Controllers/Auth/SessionController.php:46
* @route '/api/auth/me'
*/
me.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: me.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\SessionController::me
* @see app/Http/Controllers/Auth/SessionController.php:46
* @route '/api/auth/me'
*/
me.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: me.url(options),
    method: 'head',
})

const auth = {
    me: Object.assign(me, me),
    profile: Object.assign(profile, profile),
    password: Object.assign(password, password),
}

export default auth