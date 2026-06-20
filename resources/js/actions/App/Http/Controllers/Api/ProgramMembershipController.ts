import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../../wayfinder'
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

/**
* @see \App\Http\Controllers\Api\ProgramMembershipController::destroyMember
* @see app/Http/Controllers/Api/ProgramMembershipController.php:29
* @route '/api/programs/{programId}/members/{userId}'
*/
export const destroyMember = (args: { programId: string | number, userId: string | number } | [programId: string | number, userId: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyMember.url(args, options),
    method: 'delete',
})

destroyMember.definition = {
    methods: ["delete"],
    url: '/api/programs/{programId}/members/{userId}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\ProgramMembershipController::destroyMember
* @see app/Http/Controllers/Api/ProgramMembershipController.php:29
* @route '/api/programs/{programId}/members/{userId}'
*/
destroyMember.url = (args: { programId: string | number, userId: string | number } | [programId: string | number, userId: string | number ], options?: RouteQueryOptions) => {
    if (Array.isArray(args)) {
        args = {
            programId: args[0],
            userId: args[1],
        }
    }

    args = applyUrlDefaults(args)

    const parsedArgs = {
        programId: args.programId,
        userId: args.userId,
    }

    return destroyMember.definition.url
            .replace('{programId}', parsedArgs.programId.toString())
            .replace('{userId}', parsedArgs.userId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ProgramMembershipController::destroyMember
* @see app/Http/Controllers/Api/ProgramMembershipController.php:29
* @route '/api/programs/{programId}/members/{userId}'
*/
destroyMember.delete = (args: { programId: string | number, userId: string | number } | [programId: string | number, userId: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyMember.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Api\ProgramMembershipController::destroyInvitation
* @see app/Http/Controllers/Api/ProgramMembershipController.php:40
* @route '/api/programs/{programId}/invitations/{invitationId}'
*/
export const destroyInvitation = (args: { programId: string | number, invitationId: string | number } | [programId: string | number, invitationId: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyInvitation.url(args, options),
    method: 'delete',
})

destroyInvitation.definition = {
    methods: ["delete"],
    url: '/api/programs/{programId}/invitations/{invitationId}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\ProgramMembershipController::destroyInvitation
* @see app/Http/Controllers/Api/ProgramMembershipController.php:40
* @route '/api/programs/{programId}/invitations/{invitationId}'
*/
destroyInvitation.url = (args: { programId: string | number, invitationId: string | number } | [programId: string | number, invitationId: string | number ], options?: RouteQueryOptions) => {
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

    return destroyInvitation.definition.url
            .replace('{programId}', parsedArgs.programId.toString())
            .replace('{invitationId}', parsedArgs.invitationId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ProgramMembershipController::destroyInvitation
* @see app/Http/Controllers/Api/ProgramMembershipController.php:40
* @route '/api/programs/{programId}/invitations/{invitationId}'
*/
destroyInvitation.delete = (args: { programId: string | number, invitationId: string | number } | [programId: string | number, invitationId: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroyInvitation.url(args, options),
    method: 'delete',
})

/**
* @see \App\Http\Controllers\Api\ProgramMembershipController::transferOwnership
* @see app/Http/Controllers/Api/ProgramMembershipController.php:62
* @route '/api/programs/{programId}/transfer-ownership'
*/
export const transferOwnership = (args: { programId: string | number } | [programId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: transferOwnership.url(args, options),
    method: 'post',
})

transferOwnership.definition = {
    methods: ["post"],
    url: '/api/programs/{programId}/transfer-ownership',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ProgramMembershipController::transferOwnership
* @see app/Http/Controllers/Api/ProgramMembershipController.php:62
* @route '/api/programs/{programId}/transfer-ownership'
*/
transferOwnership.url = (args: { programId: string | number } | [programId: string | number ] | string | number, options?: RouteQueryOptions) => {
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

    return transferOwnership.definition.url
            .replace('{programId}', parsedArgs.programId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ProgramMembershipController::transferOwnership
* @see app/Http/Controllers/Api/ProgramMembershipController.php:62
* @route '/api/programs/{programId}/transfer-ownership'
*/
transferOwnership.post = (args: { programId: string | number } | [programId: string | number ] | string | number, options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: transferOwnership.url(args, options),
    method: 'post',
})

const ProgramMembershipController = { index, destroyMember, destroyInvitation, transferOwnership }

export default ProgramMembershipController