import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\PasswordResetController::sendLink
* @see app/Http/Controllers/Auth/PasswordResetController.php:16
* @route '/forgot-password'
*/
export const sendLink = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendLink.url(options),
    method: 'post',
})

sendLink.definition = {
    methods: ["post"],
    url: '/forgot-password',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\PasswordResetController::sendLink
* @see app/Http/Controllers/Auth/PasswordResetController.php:16
* @route '/forgot-password'
*/
sendLink.url = (options?: RouteQueryOptions) => {
    return sendLink.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\PasswordResetController::sendLink
* @see app/Http/Controllers/Auth/PasswordResetController.php:16
* @route '/forgot-password'
*/
sendLink.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: sendLink.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Auth\PasswordResetController::reset
* @see app/Http/Controllers/Auth/PasswordResetController.php:31
* @route '/reset-password'
*/
export const reset = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reset.url(options),
    method: 'post',
})

reset.definition = {
    methods: ["post"],
    url: '/reset-password',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Auth\PasswordResetController::reset
* @see app/Http/Controllers/Auth/PasswordResetController.php:31
* @route '/reset-password'
*/
reset.url = (options?: RouteQueryOptions) => {
    return reset.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\PasswordResetController::reset
* @see app/Http/Controllers/Auth/PasswordResetController.php:31
* @route '/reset-password'
*/
reset.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: reset.url(options),
    method: 'post',
})

const PasswordResetController = { sendLink, reset }

export default PasswordResetController