import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Auth\ProfileController::update
* @see app/Http/Controllers/Auth/ProfileController.php:31
* @route '/api/auth/password'
*/
export const update = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})

update.definition = {
    methods: ["put"],
    url: '/api/auth/password',
} satisfies RouteDefinition<["put"]>

/**
* @see \App\Http\Controllers\Auth\ProfileController::update
* @see app/Http/Controllers/Auth/ProfileController.php:31
* @route '/api/auth/password'
*/
update.url = (options?: RouteQueryOptions) => {
    return update.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Auth\ProfileController::update
* @see app/Http/Controllers/Auth/ProfileController.php:31
* @route '/api/auth/password'
*/
update.put = (options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(options),
    method: 'put',
})

const password = {
    update: Object.assign(update, update),
}

export default password