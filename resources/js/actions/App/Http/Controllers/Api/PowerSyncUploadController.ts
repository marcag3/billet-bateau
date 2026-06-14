import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\PowerSyncUploadController::__invoke
* @see app/Http/Controllers/Api/PowerSyncUploadController.php:22
* @route '/api/powersync/upload'
*/
const PowerSyncUploadController = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: PowerSyncUploadController.url(options),
    method: 'post',
})

PowerSyncUploadController.definition = {
    methods: ["post"],
    url: '/api/powersync/upload',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\PowerSyncUploadController::__invoke
* @see app/Http/Controllers/Api/PowerSyncUploadController.php:22
* @route '/api/powersync/upload'
*/
PowerSyncUploadController.url = (options?: RouteQueryOptions) => {
    return PowerSyncUploadController.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PowerSyncUploadController::__invoke
* @see app/Http/Controllers/Api/PowerSyncUploadController.php:22
* @route '/api/powersync/upload'
*/
PowerSyncUploadController.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: PowerSyncUploadController.url(options),
    method: 'post',
})

export default PowerSyncUploadController