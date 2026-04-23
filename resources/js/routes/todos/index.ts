import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see \App\Http\Controllers\Api\TodoController::index
* @see app/Http/Controllers/Api/TodoController.php:63
* @route '/api/todos'
*/
export const index = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/todos',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\TodoController::index
* @see app/Http/Controllers/Api/TodoController.php:63
* @route '/api/todos'
*/
index.url = (options?: RouteQueryOptions) => {
    return index.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\TodoController::index
* @see app/Http/Controllers/Api/TodoController.php:63
* @route '/api/todos'
*/
index.get = (options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\TodoController::index
* @see app/Http/Controllers/Api/TodoController.php:63
* @route '/api/todos'
*/
index.head = (options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\TodoController::store
* @see app/Http/Controllers/Api/TodoController.php:82
* @route '/api/todos'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/todos',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\TodoController::store
* @see app/Http/Controllers/Api/TodoController.php:82
* @route '/api/todos'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\TodoController::store
* @see app/Http/Controllers/Api/TodoController.php:82
* @route '/api/todos'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\TodoController::update
* @see app/Http/Controllers/Api/TodoController.php:121
* @route '/api/todos/{todo}'
*/
export const update = (args: { todo: string | { id: string } } | [todo: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

update.definition = {
    methods: ["put","patch"],
    url: '/api/todos/{todo}',
} satisfies RouteDefinition<["put","patch"]>

/**
* @see \App\Http\Controllers\Api\TodoController::update
* @see app/Http/Controllers/Api/TodoController.php:121
* @route '/api/todos/{todo}'
*/
update.url = (args: { todo: string | { id: string } } | [todo: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { todo: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { todo: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            todo: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        todo: typeof args.todo === 'object'
        ? args.todo.id
        : args.todo,
    }

    return update.definition.url
            .replace('{todo}', parsedArgs.todo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\TodoController::update
* @see app/Http/Controllers/Api/TodoController.php:121
* @route '/api/todos/{todo}'
*/
update.put = (args: { todo: string | { id: string } } | [todo: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'put'> => ({
    url: update.url(args, options),
    method: 'put',
})

/**
* @see \App\Http\Controllers\Api\TodoController::update
* @see app/Http/Controllers/Api/TodoController.php:121
* @route '/api/todos/{todo}'
*/
update.patch = (args: { todo: string | { id: string } } | [todo: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'patch'> => ({
    url: update.url(args, options),
    method: 'patch',
})

/**
* @see \App\Http\Controllers\Api\TodoController::destroy
* @see app/Http/Controllers/Api/TodoController.php:158
* @route '/api/todos/{todo}'
*/
export const destroy = (args: { todo: string | { id: string } } | [todo: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/todos/{todo}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\TodoController::destroy
* @see app/Http/Controllers/Api/TodoController.php:158
* @route '/api/todos/{todo}'
*/
destroy.url = (args: { todo: string | { id: string } } | [todo: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { todo: args }
    }

    if (typeof args === 'object' && !Array.isArray(args) && 'id' in args) {
        args = { todo: args.id }
    }

    if (Array.isArray(args)) {
        args = {
            todo: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        todo: typeof args.todo === 'object'
        ? args.todo.id
        : args.todo,
    }

    return destroy.definition.url
            .replace('{todo}', parsedArgs.todo.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\TodoController::destroy
* @see app/Http/Controllers/Api/TodoController.php:158
* @route '/api/todos/{todo}'
*/
destroy.delete = (args: { todo: string | { id: string } } | [todo: string | { id: string } ] | string | { id: string }, options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

const todos = {
    index: Object.assign(index, index),
    store: Object.assign(store, store),
    update: Object.assign(update, update),
    destroy: Object.assign(destroy, destroy),
}

export default todos