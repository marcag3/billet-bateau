import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ProgramMembershipController::index
* @see app/Http/Controllers/Api/ProgramMembershipController.php:18
* @route '/api/programs/{programId}/membership'
*/
export const index = (args: { programId: string | number } | [programId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

index.definition = {
    methods: ["get","head"],
    url: '/api/programs/{programId}/membership',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ProgramMembershipController::index
* @see app/Http/Controllers/Api/ProgramMembershipController.php:18
* @route '/api/programs/{programId}/membership'
*/
index.url = (args: { programId: string | number } | [programId: string | number ] | string | number, options?: RouteQueryOptions) => {
    if (typeof args === 'string' || typeof args === 'number') {
        args = { programId: args }
    }

    if (Array.isArray(args)) {
        args = {
            programId: args[0],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        programId: args.programId,
    }

    return index.definition.url
            .replace('{programId}', parsedArgs.programId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ProgramMembershipController::index
* @see app/Http/Controllers/Api/ProgramMembershipController.php:18
* @route '/api/programs/{programId}/membership'
*/
index.get = (args: { programId: string | number } | [programId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: index.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ProgramMembershipController::index
* @see app/Http/Controllers/Api/ProgramMembershipController.php:18
* @route '/api/programs/{programId}/membership'
*/
index.head = (args: { programId: string | number } | [programId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: index.url(args, options),
    method: 'head',
})

const membership = {
    index: Object.assign(index, index),
}

export default membership