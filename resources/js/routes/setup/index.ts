import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\InstallController::status
* @see app/Http/Controllers/Auth/InstallController.php:18
* @route '/setup/status'
*/
export const status = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})

status.definition = {
    methods: ["get","head"],
    url: '/setup/status',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Auth\InstallController::status
* @see app/Http/Controllers/Auth/InstallController.php:18
* @route '/setup/status'
*/
status.url = (options?: RouteQueryOptions) => {
    return status.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\InstallController::status
* @see app/Http/Controllers/Auth/InstallController.php:18
* @route '/setup/status'
*/
status.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: status.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Auth\InstallController::status
* @see app/Http/Controllers/Auth/InstallController.php:18
* @route '/setup/status'
*/
status.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: status.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Auth\InstallController::store
* @see app/Http/Controllers/Auth/InstallController.php:25
* @route '/setup'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/setup',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\InstallController::store
* @see app/Http/Controllers/Auth/InstallController.php:25
* @route '/setup'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\InstallController::store
* @see app/Http/Controllers/Auth/InstallController.php:25
* @route '/setup'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

const setup = {
    status: Object.assign(status, status),
    store: Object.assign(store, store),
}

export default setup