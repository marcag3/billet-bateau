<?php

namespace App\Http\Controllers;

use App\Models\BoatInventory;
use App\Http\Resources\BoatInventoryResource;
use Illuminate\Http\Request;

class BoatInventoryController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(BoatInventory::class, 'boatInventory');
    }

    public function index()
    {
        return BoatInventoryResource::collection(BoatInventory::all());
    }

    public function show(Request $request, BoatInventory $boatInventory)
    {
        return new BoatInventoryResource($boatInventory);
    }

    public function store(Request $request)
    {
        $validated = $this->validator($request);

        $boatInventory = BoatInventory::create($validated);

        return (new BoatInventoryResource($boatInventory))->response()->setStatusCode(201);
    }

    public function update(Request $request, BoatInventory $boatInventory)
    {
        $validated = $this->validator($request);
        $boatInventory->update($validated);

        return new BoatInventoryResource($boatInventory);
    }

    public function destroy(BoatInventory $boatInventory)
    {
        $boatInventory->delete();

        return response()->json();
    }

    private function validator(Request $request)
    {
        return $request->validate([
            'name'=>['string', 'required', 'max:255'],
            'boat_category_id'=>['required', 'integer', 'exists:boat_categories,id'],
            'quantity'=>['required', 'integer', 'min:0', 'max:100'],
        ]);
    }
}
