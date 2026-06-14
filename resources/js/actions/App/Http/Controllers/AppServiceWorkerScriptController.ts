import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\AppServiceWorkerScriptController::__invoke
* @see app/Http/Controllers/AppServiceWorkerScriptController.php:11
* @route '/app/sw.js'
*/
const AppServiceWorkerScriptController = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: AppServiceWorkerScriptController.url(options),
    method: 'get',
})

AppServiceWorkerScriptController.definition = {
    methods: ["get","head"],
    url: '/app/sw.js',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\AppServiceWorkerScriptController::__invoke
* @see app/Http/Controllers/AppServiceWorkerScriptController.php:11
* @route '/app/sw.js'
*/
AppServiceWorkerScriptController.url = (options?: RouteQueryOptions) => {
    return AppServiceWorkerScriptController.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\AppServiceWorkerScriptController::__invoke
* @see app/Http/Controllers/AppServiceWorkerScriptController.php:11
* @route '/app/sw.js'
*/
AppServiceWorkerScriptController.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: AppServiceWorkerScriptController.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\AppServiceWorkerScriptController::__invoke
* @see app/Http/Controllers/AppServiceWorkerScriptController.php:11
* @route '/app/sw.js'
*/
AppServiceWorkerScriptController.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: AppServiceWorkerScriptController.url(options),
    method: 'head',
})

export default AppServiceWorkerScriptController