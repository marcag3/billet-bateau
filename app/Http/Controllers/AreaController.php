<?php

namespace App\Http\Controllers;

use App\Models\Area;
use App\Http\Resources\AreaResource;
use Illuminate\Http\Request;

class AreaController extends Controller
{
    public function index()
    {
        return AreaResource::collection(Area::all());
    }

    public function show(Request $request, Area $area)
    {
        return new AreaResource($area);
    }

    public function store(Request $request)
    {
        $this->authorize('update', Area::class);
        $validated = $this->validator($request);
        $area = Area::create($validated);

        return (new AreaResource($area))->response()->setStatusCode(201);
    }

    public function update(Request $request, Area $area)
    {
        $this->authorize('update', $area);
        $validated = $this->validator($request);
        $area->update($validated);

        return new AreaResource($area);
    }

    public function destroy(Area $area)
    {
        $this->authorize('delete', $area);
        $area->delete();

        return response()->json();
    }

    private function validator(Request $request)
    {
        return $request->validate([
            'name'=>'required|string|max:100',
            'address' => 'nullable|string|max:255',
            'apartment' => 'nullable|max:255',
            'city' => 'nullable|string|max:255',
            'postalCode' => ['nullable',
                'regex:/^[ABCEGHJKLMNPRSTVXY][0-9][ABCEGHJKLMNPRSTVWXYZ] [0-9][ABCEGHJKLMNPRSTVWXYZ][0-9]/', ],
            'telephone' => ['nullable', 'regex:/^\+1 ([2-9][0-8][0-9])-([2-9][0-9]{2})-([0-9]{4})( x[0-9]+)?$/'],
            'email' => 'email|nullable',
        ]);
    }
}
