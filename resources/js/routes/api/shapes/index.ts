import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ShapeProxyController::__invoke
* @see app/Http/Controllers/Api/ShapeProxyController.php:34
* @route '/api/shapes/{shape}'
*/
export const todos = (args: { shape: string | number } | [shape: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: todos.url(args, options),
    method: 'get',
})

todos.definition = {
    methods: ["get","head"],
    url: '/api/shapes/{shape}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ShapeProxyController::__invoke
* @see app/Http/Controllers/Api/ShapeProxyController.php:34
* @route '/api/shapes/{shape}'
*/
todos.url = (args: { shape: string | number } | [shape: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return todos.definition.url
            .replace('{shape}', parsedArgs.shape.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ShapeProxyController::__invoke
* @see app/Http/Controllers/Api/ShapeProxyController.php:34
* @route '/api/shapes/{shape}'
*/
todos.get = (args: { shape: string | number } | [shape: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: todos.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ShapeProxyController::__invoke
* @see app/Http/Controllers/Api/ShapeProxyController.php:34
* @route '/api/shapes/{shape}'
*/
todos.head = (args: { shape: string | number } | [shape: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: todos.url(args, options),
    method: 'head',
})

const shapes = {
    todos: Object.assign(todos, todos),
}

export default shapes