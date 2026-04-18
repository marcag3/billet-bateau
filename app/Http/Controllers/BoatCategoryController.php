<?php

namespace App\Http\Controllers;

use App\Models\BoatCategory;
use App\Http\Resources\BoatCategoryResource;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;

class BoatCategoryController extends Controller
{
    public function index()
    {
        return BoatCategoryResource::collection(BoatCategory::all());
    }

    public function show(Request $request, BoatCategory $boatCategory)
    {
        return new BoatCategoryResource($boatCategory);
    }

    public function store(Request $request)
    {
        $this->authorize('update', BoatCategory::class);

        $validated = $this->validator($request);

        $boatCategory = BoatCategory::create(Arr::except($validated, ['image']));

        if ($request->hasFile('image')) {
            $boatCategory->image = $request->file('image')->store('boatCategoriesImages', 'public');
            $boatCategory->save();
        }

        return (new BoatCategoryResource($boatCategory))->response()->setStatusCode(201);
    }

    public function update(Request $request, BoatCategory $boatCategory)
    {
        $this->authorize('update', $boatCategory);

        $validated = $this->validator($request);

        if ($request->hasFile('image')) {
            Storage::disk('public')->delete($boatCategory->image);
            $boatCategory->image = $request->file('image')->store('boatCategoriesImages', 'public');
        }

        $boatCategory->update(Arr::except($validated, ['image']));

        return new BoatCategoryResource($boatCategory);
    }

    public function destroy(BoatCategory $boatCategory)
    {
        $this->authorize('delete', $boatCategory);

        Storage::disk('public')->delete($boatCategory->image);

        $boatCategory->delete();

        return response()->json();
    }

    private function validator(Request $request)
    {
        return $request->validate([
            'name'=>['required', 'string', 'max:255'],
            'total_capacity'=>['required', 'integer', 'min:1'],
            'teen_capacity'=>['required', 'integer', 'min:0', 'lte:total_capacity'],
            'child_capacity'=>['required', 'integer', 'min:0', 'lte:total_capacity'],
            'minimum_booking_person' =>['integer', 'min:1'],
            'description_fr'=>['string', 'nullable', 'max:500'],
            'description_en'=>['string', 'nullable', 'max:500'],
            'image'=>['nullable', 'file', 'image', 'max:100000'],
            'activity_id'=>['nullable', 'integer', 'exists:activities,id'],
        ]);
    }
}
