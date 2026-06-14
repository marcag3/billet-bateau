import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../wayfinder'
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

const PresignUploadController = { presignUpload }

export default PresignUploadController