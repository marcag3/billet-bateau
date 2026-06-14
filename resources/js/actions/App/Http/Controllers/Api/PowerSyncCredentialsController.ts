import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\PowerSyncCredentialsController::__invoke
* @see app/Http/Controllers/Api/PowerSyncCredentialsController.php:16
* @route '/api/powersync/credentials'
*/
const PowerSyncCredentialsController = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: PowerSyncCredentialsController.url(options),
    method: 'get',
})

PowerSyncCredentialsController.definition = {
    methods: ["get","head"],
    url: '/api/powersync/credentials',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\PowerSyncCredentialsController::__invoke
* @see app/Http/Controllers/Api/PowerSyncCredentialsController.php:16
* @route '/api/powersync/credentials'
*/
PowerSyncCredentialsController.url = (options?: RouteQueryOptions) => {
    return PowerSyncCredentialsController.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PowerSyncCredentialsController::__invoke
* @see app/Http/Controllers/Api/PowerSyncCredentialsController.php:16
* @route '/api/powersync/credentials'
*/
PowerSyncCredentialsController.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: PowerSyncCredentialsController.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PowerSyncCredentialsController::__invoke
* @see app/Http/Controllers/Api/PowerSyncCredentialsController.php:16
* @route '/api/powersync/credentials'
*/
PowerSyncCredentialsController.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: PowerSyncCredentialsController.url(options),
    method: 'head',
})

export default PowerSyncCredentialsController