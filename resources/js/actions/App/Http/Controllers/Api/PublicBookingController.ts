import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\PublicBookingController::bookingOptions
* @see app/Http/Controllers/Api/PublicBookingController.php:18
* @route '/api/public/programs/{program}/booking-options'
*/
export const bookingOptions = (args: { program: string | { slug: string } } | [program: string | { slug: string } ] | string | { slug: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: bookingOptions.url(args, options),
    method: 'get',
})

bookingOptions.definition = {
    methods: ["get","head"],
    url: '/api/public/programs/{program}/booking-options',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\PublicBookingController::bookingOptions
* @see app/Http/Controllers/Api/PublicBookingController.php:18
* @route '/api/public/programs/{program}/booking-options'
*/
bookingOptions.url = (args: { program: string | { slug: string } } | [program: string | { slug: string } ] | string | { slug: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { program: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'slug' in args) {
        args = { program: args.slug }
    }

    if (Array.isArray(args)) {
        args = {
            program: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        program: typeof args.program === 'object'
        ? args.program.slug
        : args.program,
    }

    return bookingOptions.definition.url
            .replace('{program}', parsedArgs.program.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PublicBookingController::bookingOptions
* @see app/Http/Controllers/Api/PublicBookingController.php:18
* @route '/api/public/programs/{program}/booking-options'
*/
bookingOptions.get = (args: { program: string | { slug: string } } | [program: string | { slug: string } ] | string | { slug: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: bookingOptions.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PublicBookingController::bookingOptions
* @see app/Http/Controllers/Api/PublicBookingController.php:18
* @route '/api/public/programs/{program}/booking-options'
*/
bookingOptions.head = (args: { program: string | { slug: string } } | [program: string | { slug: string } ] | string | { slug: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: bookingOptions.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\PublicBookingController::store
* @see app/Http/Controllers/Api/PublicBookingController.php:61
* @route '/api/public/programs/{program}/bookings'
*/
export const store = (args: { program: string | { slug: string } } | [program: string | { slug: string } ] | string | { slug: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/public/programs/{program}/bookings',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\PublicBookingController::store
* @see app/Http/Controllers/Api/PublicBookingController.php:61
* @route '/api/public/programs/{program}/bookings'
*/
store.url = (args: { program: string | { slug: string } } | [program: string | { slug: string } ] | string | { slug: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { program: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'slug' in args) {
        args = { program: args.slug }
    }

    if (Array.isArray(args)) {
        args = {
            program: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        program: typeof args.program === 'object'
        ? args.program.slug
        : args.program,
    }

    return store.definition.url
            .replace('{program}', parsedArgs.program.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PublicBookingController::store
* @see app/Http/Controllers/Api/PublicBookingController.php:61
* @route '/api/public/programs/{program}/bookings'
*/
store.post = (args: { program: string | { slug: string } } | [program: string | { slug: string } ] | string | { slug: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

const PublicBookingController = { bookingOptions, store }

export default PublicBookingController