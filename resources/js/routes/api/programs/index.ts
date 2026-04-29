import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ProgramController::store
* @see app/Http/Controllers/Api/ProgramController.php:16
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
* @see app/Http/Controllers/Api/ProgramController.php:16
* @route '/api/programs'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ProgramController::store
* @see app/Http/Controllers/Api/ProgramController.php:16
* @route '/api/programs'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

const programs = {
    store: Object.assign(store, store),
}

export default programs