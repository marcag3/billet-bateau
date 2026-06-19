import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\PublicBookingCancelController::show
* @see app/Http/Controllers/Api/PublicBookingCancelController.php:11
* @route '/api/public/bookings/cancel/{token}'
*/
export const show = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/public/bookings/cancel/{token}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\PublicBookingCancelController::show
* @see app/Http/Controllers/Api/PublicBookingCancelController.php:11
* @route '/api/public/bookings/cancel/{token}'
*/
show.url = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{token}', parsedArgs.token.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PublicBookingCancelController::show
* @see app/Http/Controllers/Api/PublicBookingCancelController.php:11
* @route '/api/public/bookings/cancel/{token}'
*/
show.get = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PublicBookingCancelController::show
* @see app/Http/Controllers/Api/PublicBookingCancelController.php:11
* @route '/api/public/bookings/cancel/{token}'
*/
show.head = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\PublicBookingCancelController::cancel
* @see app/Http/Controllers/Api/PublicBookingCancelController.php:28
* @route '/api/public/bookings/cancel/{token}'
*/
export const cancel = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancel.url(args, options),
    method: 'post',
})

cancel.definition = {
    methods: ["post"],
    url: '/api/public/bookings/cancel/{token}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\PublicBookingCancelController::cancel
* @see app/Http/Controllers/Api/PublicBookingCancelController.php:28
* @route '/api/public/bookings/cancel/{token}'
*/
cancel.url = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return cancel.definition.url
            .replace('{token}', parsedArgs.token.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PublicBookingCancelController::cancel
* @see app/Http/Controllers/Api/PublicBookingCancelController.php:28
* @route '/api/public/bookings/cancel/{token}'
*/
cancel.post = (args: { token: string | number } | [token: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: cancel.url(args, options),
    method: 'post',
})

const PublicBookingCancelController = { show, cancel }

export default PublicBookingCancelController