<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Role::class, 'role');
    }

    public function index()
    {
        $roles = Role::all();

        return view('roles.index', compact('roles'));
    }

    public function create()
    {
        return view('roles.create');
    }

    public function store(Request $request)
    {
        $validated = $this->validator($request);

        $role = Role::create(['name'=>$validated['name']]);

        $role->syncPermissions(array_keys($validated['permissions']));

        flash('Role créé')->success();

        return redirect(route('roles.show', $role->id));
    }

    public function show(Role $role)
    {
        return view('roles.show', compact('role'));
    }

    public function edit(Role $role)
    {
        return view('roles.edit', compact('role'));
    }

    public function update(Request $request, Role $role)
    {
        $validated = $this->validator($request, $role);

        $role->update(['name'=>$validated['name']]);

        $role->syncPermissions(array_keys($validated['permissions']));

        flash('Role mis à jour')->success();

        return back();
    }

    public function destroy(Role $role)
    {
        $role->delete();

        flash('Role supprimé')->success();

        return $this->index();
    }

    private function validator(Request $request, ?Role $role = null)
    {
        return $request->validate([
            'name'=>['required', 'max:255', Rule::unique('roles', 'name')->ignore($role)],
            'permissions'=>'nullable',
            'permissions.*'=>'in:1',

        ]);
    }
}
