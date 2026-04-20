import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\TodoShapeProxyController::__invoke
* @see app/Http/Controllers/Api/TodoShapeProxyController.php:26
* @route '/api/shapes/todos'
*/
const TodoShapeProxyController = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: TodoShapeProxyController.url(options),
    method: 'get',
})

TodoShapeProxyController.definition = {
    methods: ["get","head"],
    url: '/api/shapes/todos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\TodoShapeProxyController::__invoke
* @see app/Http/Controllers/Api/TodoShapeProxyController.php:26
* @route '/api/shapes/todos'
*/
TodoShapeProxyController.url = (options?: RouteQueryOptions) => {
    return TodoShapeProxyController.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\TodoShapeProxyController::__invoke
* @see app/Http/Controllers/Api/TodoShapeProxyController.php:26
* @route '/api/shapes/todos'
*/
TodoShapeProxyController.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: TodoShapeProxyController.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TodoShapeProxyController::__invoke
* @see app/Http/Controllers/Api/TodoShapeProxyController.php:26
* @route '/api/shapes/todos'
*/
TodoShapeProxyController.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: TodoShapeProxyController.url(options),
    method: 'head',
})

export default TodoShapeProxyController