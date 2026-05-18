import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\PublicBookingController::store
* @see app/Http/Controllers/Api/PublicBookingController.php:82
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
* @see app/Http/Controllers/Api/PublicBookingController.php:82
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
* @see app/Http/Controllers/Api/PublicBookingController.php:82
* @route '/api/public/programs/{program}/bookings'
*/
store.post = (args: { program: string | { slug: string } } | [program: string | { slug: string } ] | string | { slug: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

const bookings = {
    store: Object.assign(store, store),
}

export default bookings