import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ShapeProxyController::__invoke
* @see app/Http/Controllers/Api/ShapeProxyController.php:33
* @route '/api/shapes/{shape}'
*/
const ShapeProxyController = (args: { shape: string | number } | [shape: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ShapeProxyController.url(args, options),
    method: 'get',
})

ShapeProxyController.definition = {
    methods: ["get","head"],
    url: '/api/shapes/{shape}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ShapeProxyController::__invoke
* @see app/Http/Controllers/Api/ShapeProxyController.php:33
* @route '/api/shapes/{shape}'
*/
ShapeProxyController.url = (args: { shape: string | number } | [shape: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { shape: args }
    }

    if (Array.isArray(args)) {
        args = {
            shape: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        shape: args.shape,
    }

    return ShapeProxyController.definition.url
            .replace('{shape}', parsedArgs.shape.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ShapeProxyController::__invoke
* @see app/Http/Controllers/Api/ShapeProxyController.php:33
* @route '/api/shapes/{shape}'
*/
ShapeProxyController.get = (args: { shape: string | number } | [shape: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: ShapeProxyController.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ShapeProxyController::__invoke
* @see app/Http/Controllers/Api/ShapeProxyController.php:33
* @route '/api/shapes/{shape}'
*/
ShapeProxyController.head = (args: { shape: string | number } | [shape: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: ShapeProxyController.url(args, options),
    method: 'head',
})

export default ShapeProxyController