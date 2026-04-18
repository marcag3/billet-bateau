<?php

namespace App\Http\Controllers;

use App\Http\Resources\PointOfSaleResource;
use App\Models\PointOfSale;
use Illuminate\Http\Request;

class PointOfSaleController extends Controller
{
    public function index()
    {
        $query = PointOfSale::query();
        if (! auth()->check('user')) {
            $query->where('is_for_client', true);
        }

        return PointOfSaleResource::collection($query->get());
    }

    public function show(Request $request, PointOfSale $pointOfSale)
    {
        return new PointOfSaleResource($pointOfSale);
    }

    public function store(Request $request)
    {
        $this->authorize('update', PointOfSale::class);
        $validated = $this->validator($request);
        $pointOfSale = PointOfSale::create($validated);

        return (new PointOfSaleResource($pointOfSale))->response()->setStatusCode(201);
    }

    public function update(Request $request, PointOfSale $pointOfSale)
    {
        $this->authorize('update', $pointOfSale);
        $validated = $this->validator($request);
        $pointOfSale->update($validated);

        return new PointOfSaleResource($pointOfSale);
    }

    public function destroy(PointOfSale $pointOfSale)
    {
        $this->authorize('delete', $pointOfSale);
        $pointOfSale->delete();

        return response()->json();
    }

    private function validator(Request $request)
    {
        return $request->validate([
            'name'=>['required', 'max:100', 'string'],
            'is_for_client'=>'boolean|required',
            'area_id'=>'required|exists:areas,id',
            'square_location_id'=>'nullable|string|max:255',
        ]);
    }
}
