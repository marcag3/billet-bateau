import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\TodoShapeProxyController::__invoke
* @see app/Http/Controllers/Api/TodoShapeProxyController.php:26
* @route '/api/shapes/todos'
*/
export const todos = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: todos.url(options),
    method: 'get',
})

todos.definition = {
    methods: ["get","head"],
    url: '/api/shapes/todos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\TodoShapeProxyController::__invoke
* @see app/Http/Controllers/Api/TodoShapeProxyController.php:26
* @route '/api/shapes/todos'
*/
todos.url = (options?: RouteQueryOptions) => {
    return todos.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\TodoShapeProxyController::__invoke
* @see app/Http/Controllers/Api/TodoShapeProxyController.php:26
* @route '/api/shapes/todos'
*/
todos.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: todos.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TodoShapeProxyController::__invoke
* @see app/Http/Controllers/Api/TodoShapeProxyController.php:26
* @route '/api/shapes/todos'
*/
todos.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: todos.url(options),
    method: 'head',
})

const shapes = {
    todos: Object.assign(todos, todos),
}

export default shapes