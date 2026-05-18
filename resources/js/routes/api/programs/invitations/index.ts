import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ProgramInvitationController::eligibility
* @see app/Http/Controllers/Api/ProgramInvitationController.php:20
* @route '/api/programs/{programId}/invitation-eligibility'
*/
export const eligibility = (args: { programId: string | number } | [programId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: eligibility.url(args, options),
    method: 'get',
})

eligibility.definition = {
    methods: ["get","head"],
    url: '/api/programs/{programId}/invitation-eligibility',
} satisfies RouteDefinition<["get","head"]>

/**
* @see \App\Http\Controllers\Api\ProgramInvitationController::eligibility
* @see app/Http/Controllers/Api/ProgramInvitationController.php:20
* @route '/api/programs/{programId}/invitation-eligibility'
*/
eligibility.url = (args: { programId: string | number } | [programId: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return eligibility.definition.url
            .replace('{programId}', parsedArgs.programId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ProgramInvitationController::eligibility
* @see app/Http/Controllers/Api/ProgramInvitationController.php:20
* @route '/api/programs/{programId}/invitation-eligibility'
*/
eligibility.get = (args: { programId: string | number } | [programId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'get'> => ({
    url: eligibility.url(args, options),
    method: 'get',
})

/**
* @see \App\Http\Controllers\Api\ProgramInvitationController::eligibility
* @see app/Http/Controllers/Api/ProgramInvitationController.php:20
* @route '/api/programs/{programId}/invitation-eligibility'
*/
eligibility.head = (args: { programId: string | number } | [programId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'head'> => ({
    url: eligibility.url(args, options),
    method: 'head',
})

/**
* @see \App\Http\Controllers\Api\ProgramInvitationController::store
* @see app/Http/Controllers/Api/ProgramInvitationController.php:36
* @route '/api/programs/{programId}/invitations'
*/
export const store = (args: { programId: string | number } | [programId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/programs/{programId}/invitations',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ProgramInvitationController::store
* @see app/Http/Controllers/Api/ProgramInvitationController.php:36
* @route '/api/programs/{programId}/invitations'
*/
store.url = (args: { programId: string | number } | [programId: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return store.definition.url
            .replace('{programId}', parsedArgs.programId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ProgramInvitationController::store
* @see app/Http/Controllers/Api/ProgramInvitationController.php:36
* @route '/api/programs/{programId}/invitations'
*/
store.post = (args: { programId: string | number } | [programId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

const invitations = {
    eligibility: Object.assign(eligibility, eligibility),
    store: Object.assign(store, store),
}

export default invitations