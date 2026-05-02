import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../wayfinder'
/**
* @see routes/web.php:37
* @route '/{fallbackPlaceholder}'
*/
export const spa = (args: { fallbackPlaceholder: string | number } | [fallbackPlaceholder: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: spa.url(args, options),
    method: 'get',
})

spa.definition = {
    methods: ["get","head"],
    url: '/{fallbackPlaceholder}',
} satisfies RouteDefinition<["get","head"]>

/**
* @see routes/web.php:37
* @route '/{fallbackPlaceholder}'
*/
spa.url = (args: { fallbackPlaceholder: string | number } | [fallbackPlaceholder: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { fallbackPlaceholder: args }
    }

    if (Array.isArray(args)) {
        args = {
            fallbackPlaceholder: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        fallbackPlaceholder: args.fallbackPlaceholder,
    }

    return spa.definition.url
            .replace('{fallbackPlaceholder}', parsedArgs.fallbackPlaceholder.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see routes/web.php:37
* @route '/{fallbackPlaceholder}'
*/
spa.get = (args: { fallbackPlaceholder: string | number } | [fallbackPlaceholder: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: spa.url(args, options),
    method: 'get',
})

/**
* @see routes/web.php:37
* @route '/{fallbackPlaceholder}'
*/
spa.head = (args: { fallbackPlaceholder: string | number } | [fallbackPlaceholder: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: spa.url(args, options),
    method: 'head',
})

const publicMethod = {
    spa: Object.assign(spa, spa),
}

export default publicMethod