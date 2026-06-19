import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ProgramInvitationController::store
* @see app/Http/Controllers/Api/ProgramInvitationController.php:20
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
* @see app/Http/Controllers/Api/ProgramInvitationController.php:20
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
* @see app/Http/Controllers/Api/ProgramInvitationController.php:20
* @route '/api/programs/{programId}/invitations'
*/
store.post = (args: { programId: string | number } | [programId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(args, options),
    method: 'post',
})

/**
* @see \App\Http\Controllers\Api\ProgramMembershipController::destroy
* @see app/Http/Controllers/Api/ProgramMembershipController.php:40
* @route '/api/programs/{programId}/invitations/{invitationId}'
*/
export const destroy = (args: { programId: string | number, invitationId: string | number } | [programId: string | number, invitationId: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/programs/{programId}/invitations/{invitationId}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\ProgramMembershipController::destroy
* @see app/Http/Controllers/Api/ProgramMembershipController.php:40
* @route '/api/programs/{programId}/invitations/{invitationId}'
*/
destroy.url = (args: { programId: string | number, invitationId: string | number } | [programId: string | number, invitationId: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            programId: args[0],
            invitationId: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        programId: args.programId,
        invitationId: args.invitationId,
    }

    return destroy.definition.url
            .replace('{programId}', parsedArgs.programId.toString())
            .replace('{invitationId}', parsedArgs.invitationId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ProgramMembershipController::destroy
* @see app/Http/Controllers/Api/ProgramMembershipController.php:40
* @route '/api/programs/{programId}/invitations/{invitationId}'
*/
destroy.delete = (args: { programId: string | number, invitationId: string | number } | [programId: string | number, invitationId: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

const invitations = {
    store: Object.assign(store, store),
    destroy: Object.assign(destroy, destroy),
}

export default invitations