import { queryParams, type RouteQueryOptions, type RouteDefinition, applyUrlDefaults } from './../../../../wayfinder'
/**
* @see \App\Http\Controllers\Api\ProgramMembershipController::destroy
* @see app/Http/Controllers/Api/ProgramMembershipController.php:29
* @route '/api/programs/{programId}/members/{userId}'
*/
export const destroy = (args: { programId: string | number, userId: string | number } | [programId: string | number, userId: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

destroy.definition = {
    methods: ["delete"],
    url: '/api/programs/{programId}/members/{userId}',
} satisfies RouteDefinition<["delete"]>

/**
* @see \App\Http\Controllers\Api\ProgramMembershipController::destroy
* @see app/Http/Controllers/Api/ProgramMembershipController.php:29
* @route '/api/programs/{programId}/members/{userId}'
*/
destroy.url = (args: { programId: string | number, userId: string | number } | [programId: string | number, userId: string | number ], options?: RouteQueryOptions) => {
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

    return destroy.definition.url
            .replace('{programId}', parsedArgs.programId.toString())
            .replace('{userId}', parsedArgs.userId.toString())
            .replace(/\/+$/, '') + queryParams(options)
}

/**
* @see \App\Http\Controllers\Api\ProgramMembershipController::destroy
* @see app/Http/Controllers/Api/ProgramMembershipController.php:29
* @route '/api/programs/{programId}/members/{userId}'
*/
destroy.delete = (args: { programId: string | number, userId: string | number } | [programId: string | number, userId: string | number ], options?: RouteQueryOptions): RouteDefinition<'delete'> => ({
    url: destroy.url(args, options),
    method: 'delete',
})

const members = {
    destroy: Object.assign(destroy, destroy),
}

export default members