import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\AppServiceWorkerConfigController::__invoke
* @see app/Http/Controllers/AppServiceWorkerConfigController.php:12
* @route '/app/sw-config.json'
*/
const AppServiceWorkerConfigController = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: AppServiceWorkerConfigController.url(options),
    method: 'get',
})

AppServiceWorkerConfigController.definition = {
    methods: ["get","head"],
    url: '/app/sw-config.json',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AppServiceWorkerConfigController::__invoke
* @see app/Http/Controllers/AppServiceWorkerConfigController.php:12
* @route '/app/sw-config.json'
*/
AppServiceWorkerConfigController.url = (options?: RouteQueryOptions) => {
    return AppServiceWorkerConfigController.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AppServiceWorkerConfigController::__invoke
* @see app/Http/Controllers/AppServiceWorkerConfigController.php:12
* @route '/app/sw-config.json'
*/
AppServiceWorkerConfigController.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: AppServiceWorkerConfigController.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppServiceWorkerConfigController::__invoke
* @see app/Http/Controllers/AppServiceWorkerConfigController.php:12
* @route '/app/sw-config.json'
*/
AppServiceWorkerConfigController.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: AppServiceWorkerConfigController.url(options),
    method: 'head',
})

export default AppServiceWorkerConfigController