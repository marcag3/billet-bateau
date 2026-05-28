import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
import bookings from './bookings'
/**
* @see \App\Http\Controllers\Api\PublicProgramController::index
* @see app/Http/Controllers/Api/PublicProgramController.php:13
* @route '/api/public/programs'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/public/programs',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\PublicProgramController::index
* @see app/Http/Controllers/Api/PublicProgramController.php:13
* @route '/api/public/programs'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PublicProgramController::index
* @see app/Http/Controllers/Api/PublicProgramController.php:13
* @route '/api/public/programs'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PublicProgramController::index
* @see app/Http/Controllers/Api/PublicProgramController.php:13
* @route '/api/public/programs'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\PublicProgramController::show
* @see app/Http/Controllers/Api/PublicProgramController.php:24
* @route '/api/public/programs/{program}'
*/
export const show = (args: { program: string | { slug: string } } | [program: string | { slug: string } ] | string | { slug: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

show.definition = {
    methods: ["get","head"],
    url: '/api/public/programs/{program}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\PublicProgramController::show
* @see app/Http/Controllers/Api/PublicProgramController.php:24
* @route '/api/public/programs/{program}'
*/
show.url = (args: { program: string | { slug: string } } | [program: string | { slug: string } ] | string | { slug: string }, options?: RouteQueryOptions) => {
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

    return show.definition.url
            .replace('{program}', parsedArgs.program.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PublicProgramController::show
* @see app/Http/Controllers/Api/PublicProgramController.php:24
* @route '/api/public/programs/{program}'
*/
show.get = (args: { program: string | { slug: string } } | [program: string | { slug: string } ] | string | { slug: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: show.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PublicProgramController::show
* @see app/Http/Controllers/Api/PublicProgramController.php:24
* @route '/api/public/programs/{program}'
*/
show.head = (args: { program: string | { slug: string } } | [program: string | { slug: string } ] | string | { slug: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: show.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\PublicBookingController::bookingOptions
* @see app/Http/Controllers/Api/PublicBookingController.php:19
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
* @see app/Http/Controllers/Api/PublicBookingController.php:19
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
* @see app/Http/Controllers/Api/PublicBookingController.php:19
* @route '/api/public/programs/{program}/booking-options'
*/
bookingOptions.get = (args: { program: string | { slug: string } } | [program: string | { slug: string } ] | string | { slug: string }, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: bookingOptions.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PublicBookingController::bookingOptions
* @see app/Http/Controllers/Api/PublicBookingController.php:19
* @route '/api/public/programs/{program}/booking-options'
*/
bookingOptions.head = (args: { program: string | { slug: string } } | [program: string | { slug: string } ] | string | { slug: string }, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: bookingOptions.url(args, options),
    method: 'head',
})

const programs = {
    index: Object.assign(index, index),
    show: Object.assign(show, show),
    bookingOptions: Object.assign(bookingOptions, bookingOptions),
    bookings: Object.assign(bookings, bookings),
}

export default programs