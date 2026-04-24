import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ProgramController::store
* @see app/Http/Controllers/Api/ProgramController.php:59
* @route '/api/programs/{program}/media'
*/
export const store = (args: { program: string | { id: string } } | [program: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/programs/{program}/media',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ProgramController::store
* @see app/Http/Controllers/Api/ProgramController.php:59
* @route '/api/programs/{program}/media'
*/
store.url = (args: { program: string | { id: string } } | [program: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
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

    return store.definition.url
            .replace('{program}', parsedArgs.program.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ProgramController::store
* @see app/Http/Controllers/Api/ProgramController.php:59
* @route '/api/programs/{program}/media'
*/
store.post = (args: { program: string | { id: string } } | [program: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

const media = {
    store: Object.assign(store, store),
}

export default media