import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\BoatTypeController::store
* @see app/Http/Controllers/Api/BoatTypeController.php:14
* @route '/api/boat-types/{boatType}/media'
*/
export const store = (args: { boatType: string | { id: string } } | [boatType: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/boat-types/{boatType}/media',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\BoatTypeController::store
* @see app/Http/Controllers/Api/BoatTypeController.php:14
* @route '/api/boat-types/{boatType}/media'
*/
store.url = (args: { boatType: string | { id: string } } | [boatType: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { boatType: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { boatType: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            boatType: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        boatType: typeof args.boatType === 'object'
        ? args.boatType.id
        : args.boatType,
    }

    return store.definition.url
            .replace('{boatType}', parsedArgs.boatType.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\BoatTypeController::store
* @see app/Http/Controllers/Api/BoatTypeController.php:14
* @route '/api/boat-types/{boatType}/media'
*/
store.post = (args: { boatType: string | { id: string } } | [boatType: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

const media = {
    store: Object.assign(store, store),
}

export default media