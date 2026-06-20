import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\ProfileController::update
* @see app/Http/Controllers/Auth/ProfileController.php:12
* @route '/api/auth/profile'
*/
export const update = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/auth/profile',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Auth\ProfileController::update
* @see app/Http/Controllers/Auth/ProfileController.php:12
* @route '/api/auth/profile'
*/
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\ProfileController::update
* @see app/Http/Controllers/Auth/ProfileController.php:12
* @route '/api/auth/profile'
*/
update.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})

const profile = {
    update: Object.assign(update, update),
}

export default profile