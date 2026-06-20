import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../wayfinder'
import invitations from './invitations'
import membership from './membership'
import members from './members'
/**
* @see \App\Http\Controllers\Api\ProgramController::store
* @see app/Http/Controllers/Api/ProgramController.php:17
* @route '/api/programs'
*/
export const store = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
})

store.definition = {
    methods: ["post"],
    url: '/api/programs',
} satisfies RouteDefinition<["post"]>

/**
* @see \App\Http\Controllers\Api\ProgramController::store
* @see app/Http/Controllers/Api/ProgramController.php:17
* @route '/api/programs'
*/
store.url = (options?: RouteQueryOptions) => {
    return store.definition.url + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ProgramController::store
* @see app/Http/Controllers/Api/ProgramController.php:17
* @route '/api/programs'
*/
store.post = (options?: RouteQueryOptions): RouteDefinition<'post'> => ({
    url: store.url(options),
    method: 'post',
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

const programs = {
    store: Object.assign(store, store),
    invitations: Object.assign(invitations, invitations),
    membership: Object.assign(membership, membership),
    members: Object.assign(members, members),
    transferOwnership: Object.assign(transferOwnership, transferOwnership),
}

export default programs