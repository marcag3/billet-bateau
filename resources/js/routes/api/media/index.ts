import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\MediaController::index
* @see app/Http/Controllers/Api/MediaController.php:20
* @route '/api/media/{type}/{id}'
*/
export const index = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/media/{type}/{id}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\MediaController::index
* @see app/Http/Controllers/Api/MediaController.php:20
* @route '/api/media/{type}/{id}'
*/
index.url = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            type: args[0],
            id: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        type: args.type,
        id: args.id,
    }

    return index.definition.url
            .replace('{type}', parsedArgs.type.toString())
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\MediaController::index
* @see app/Http/Controllers/Api/MediaController.php:20
* @route '/api/media/{type}/{id}'
*/
index.get = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\MediaController::index
* @see app/Http/Controllers/Api/MediaController.php:20
* @route '/api/media/{type}/{id}'
*/
index.head = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\MediaController::store
* @see app/Http/Controllers/Api/MediaController.php:38
* @route '/api/media/{type}/{id}'
*/
export const store = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/media/{type}/{id}',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\MediaController::store
* @see app/Http/Controllers/Api/MediaController.php:38
* @route '/api/media/{type}/{id}'
*/
store.url = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            type: args[0],
            id: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        type: args.type,
        id: args.id,
    }

    return store.definition.url
            .replace('{type}', parsedArgs.type.toString())
            .replace('{id}', parsedArgs.id.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\MediaController::store
* @see app/Http/Controllers/Api/MediaController.php:38
* @route '/api/media/{type}/{id}'
*/
store.post = (args: { type: string | number, id: string | number } | [type: string | number, id: string | number ], options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\MediaController::destroy
* @see app/Http/Controllers/Api/MediaController.php:68
* @route '/api/media/{type}/{id}/{media}'
*/
export const destroy = (args: { type: string | number, id: string | number, media: string | number } | [type: string | number, id: string | number, media: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/media/{type}/{id}/{media}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\MediaController::destroy
* @see app/Http/Controllers/Api/MediaController.php:68
* @route '/api/media/{type}/{id}/{media}'
*/
destroy.url = (args: { type: string | number, id: string | number, media: string | number } | [type: string | number, id: string | number, media: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            type: args[0],
            id: args[1],
            media: args[2],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        type: args.type,
        id: args.id,
        media: args.media,
    }

    return destroy.definition.url
            .replace('{type}', parsedArgs.type.toString())
            .replace('{id}', parsedArgs.id.toString())
            .replace('{media}', parsedArgs.media.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\MediaController::destroy
* @see app/Http/Controllers/Api/MediaController.php:68
* @route '/api/media/{type}/{id}/{media}'
*/
destroy.delete = (args: { type: string | number, id: string | number, media: string | number } | [type: string | number, id: string | number, media: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

const media = {
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    destroy: Object.assign(destroy, destroy),
}

export default media