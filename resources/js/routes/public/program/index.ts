import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
/**
* @see routes/web.php:12
* @route '/programs/{identifier}'
*/
export const fallback = (args: { identifier: string | number } | [identifier: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: fallback.url(args, options),
    method: 'get',
})

fallback.definition = {
    methods: ["get","head"],
    url: '/programs/{identifier}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:12
* @route '/programs/{identifier}'
*/
fallback.url = (args: { identifier: string | number } | [identifier: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { identifier: args }
    }

    if (Array.isArray(args)) {
        args = {
            identifier: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        identifier: args.identifier,
    }

    return fallback.definition.url
            .replace('{identifier}', parsedArgs.identifier.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see routes/web.php:12
* @route '/programs/{identifier}'
*/
fallback.get = (args: { identifier: string | number } | [identifier: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: fallback.url(args, options),
    method: 'get',
})

/**
* @see routes/web.php:12
* @route '/programs/{identifier}'
*/
fallback.head = (args: { identifier: string | number } | [identifier: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: fallback.url(args, options),
    method: 'head',
})

const program = {
    fallback: Object.assign(fallback, fallback),
}

export default program