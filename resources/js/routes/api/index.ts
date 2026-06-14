import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../wayfinder'
import publicMethod from './public'
import auth from './auth'
import powersync from './powersync'
import programs from './programs'
/**
* @see \App\Http\Controllers\Api\PresignUploadController::presignUpload
* @see app/Http/Controllers/Api/PresignUploadController.php:19
* @route '/api/presign-upload'
*/
export const presignUpload = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: presignUpload.url(options),
    method: 'post',
})

presignUpload.definition = {
    methods: ["post"],
    url: '/api/presign-upload',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\PresignUploadController::presignUpload
* @see app/Http/Controllers/Api/PresignUploadController.php:19
* @route '/api/presign-upload'
*/
presignUpload.url = (options?: RouteQueryOptions) => {
    return presignUpload.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\PresignUploadController::presignUpload
* @see app/Http/Controllers/Api/PresignUploadController.php:19
* @route '/api/presign-upload'
*/
presignUpload.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: presignUpload.url(options),
    method: 'post',
})

const api = {
    public: Object.assign(publicMethod, publicMethod),
    auth: Object.assign(auth, auth),
    powersync: Object.assign(powersync, powersync),
    programs: Object.assign(programs, programs),
    presignUpload: Object.assign(presignUpload, presignUpload),
}

export default api