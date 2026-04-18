<?php

namespace App\Http\Controllers;

use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(User::class, 'user');
    }

    public function index(Request $request)
    {
        $users = User::all();
        if ($request->expectsJson()) {
            return UserResource::collection($users);
        } else {
            return view('users.index', compact('users'));
        }
    }

    public function show(Request $request, User $user)
    {
        if ($request->expectsJson()) {
            return new UserResource($user);
        } else {
            return view('users.show', compact('user'));
        }
    }

    public function edit(User $user)
    {
        return view('users.edit', compact('user'));
    }

    public function update(Request $request, User $user)
    {
        $validated = $this->validator($request);

        $user->update($validated);

        $roles = $request->validate([
            'roles.*'=>'exists:roles,id',
        ]);

        $user->syncRoles($roles);

        flash('Jedi mis à jour')->success();
        if ($request->expectsJson()) {
            return new UserResource($user);
        } else {
            return redirect(route('users.show', $user->id));
        }
    }

    public function destroy(Request $request, User $user)
    {
        $user->delete();

        flash('Jedi supprimé')->success();
        if ($request->expectsJson()) {
            return response()->json();
        } else {
            return $this->index($request);
        }
    }

    private function validator(Request $request)
    {
        return $request->validate([
            'name'=>'required|string|max:255',
            'email'=>'email|required',
        ]);
    }
}
