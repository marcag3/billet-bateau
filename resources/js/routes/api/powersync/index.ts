import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\PowerSyncCredentialsController::__invoke
* @see app/Http/Controllers/Api/PowerSyncCredentialsController.php:16
* @route '/api/powersync/credentials'
*/
export const credentials = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: credentials.url(options),
    method: 'get',
})

credentials.definition = {
    methods: ["get","head"],
    url: '/api/powersync/credentials',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\PowerSyncCredentialsController::__invoke
* @see app/Http/Controllers/Api/PowerSyncCredentialsController.php:16
* @route '/api/powersync/credentials'
*/
credentials.url = (options?: RouteQueryOptions) => {
    return credentials.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PowerSyncCredentialsController::__invoke
* @see app/Http/Controllers/Api/PowerSyncCredentialsController.php:16
* @route '/api/powersync/credentials'
*/
credentials.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: credentials.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\PowerSyncCredentialsController::__invoke
* @see app/Http/Controllers/Api/PowerSyncCredentialsController.php:16
* @route '/api/powersync/credentials'
*/
credentials.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: credentials.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\PowerSyncUploadController::__invoke
* @see app/Http/Controllers/Api/PowerSyncUploadController.php:15
* @route '/api/powersync/upload'
*/
export const upload = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: upload.url(options),
    method: 'post',
})

upload.definition = {
    methods: ["post"],
    url: '/api/powersync/upload',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\PowerSyncUploadController::__invoke
* @see app/Http/Controllers/Api/PowerSyncUploadController.php:15
* @route '/api/powersync/upload'
*/
upload.url = (options?: RouteQueryOptions) => {
    return upload.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PowerSyncUploadController::__invoke
* @see app/Http/Controllers/Api/PowerSyncUploadController.php:15
* @route '/api/powersync/upload'
*/
upload.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: upload.url(options),
    method: 'post',
})

const powersync = {
    credentials: Object.assign(credentials, credentials),
    upload: Object.assign(upload, upload),
}

export default powersync