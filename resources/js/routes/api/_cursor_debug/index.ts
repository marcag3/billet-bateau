import { queryParams, type RouteQueryOptions, type RouteDefinition } from './../../../wayfinder'
/**
* @see routes/api.php:16
* @route '/api/_cursor-debug/ingest-d855ad'
*/
export const ingest_d855ad = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: ingest_d855ad.url(options),
    method: 'post',
})

ingest_d855ad.definition = {
    methods: ["post"],
    url: '/api/_cursor-debug/ingest-d855ad',
} satisfies RouteDefinition<["post"]>

/**
* @see routes/api.php:16
* @route '/api/_cursor-debug/ingest-d855ad'
*/
ingest_d855ad.url = (options?: RouteQueryOptions) => {
    return ingest_d855ad.definition.url + queryParams(options)
}

/**
* @see routes/api.php:16
* @route '/api/_cursor-debug/ingest-d855ad'
*/
ingest_d855ad.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: ingest_d855ad.url(options),
    method: 'post',
})

const _cursor_debug = {
    ingest_d855ad: Object.assign(ingest_d855ad, ingest_d855ad),
}

export default _cursor_debug