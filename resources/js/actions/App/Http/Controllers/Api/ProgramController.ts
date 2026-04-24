import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ProgramController::store
* @see app/Http/Controllers/Api/ProgramController.php:17
* @route '/api/programs'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/programs',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ProgramController::store
* @see app/Http/Controllers/Api/ProgramController.php:17
* @route '/api/programs'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ProgramController::store
* @see app/Http/Controllers/Api/ProgramController.php:17
* @route '/api/programs'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ProgramController::storeMedia
* @see app/Http/Controllers/Api/ProgramController.php:59
* @route '/api/programs/{program}/media'
*/
export const storeMedia = (args: { program: string | { id: string } } | [program: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeMedia.url(args, options),
    method: 'post',
})

storeMedia.definition = {
    methods: ["post"],
    url: '/api/programs/{program}/media',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ProgramController::storeMedia
* @see app/Http/Controllers/Api/ProgramController.php:59
* @route '/api/programs/{program}/media'
*/
storeMedia.url = (args: { program: string | { id: string } } | [program: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { program: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { program: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            program: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        program: typeof args.program === 'object'
        ? args.program.id
        : args.program,
    }

    return storeMedia.definition.url
            .replace('{program}', parsedArgs.program.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ProgramController::storeMedia
* @see app/Http/Controllers/Api/ProgramController.php:59
* @route '/api/programs/{program}/media'
*/
storeMedia.post = (args: { program: string | { id: string } } | [program: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: storeMedia.url(args, options),
    method: 'post',
})

const ProgramController = { store, storeMedia }

export default ProgramController