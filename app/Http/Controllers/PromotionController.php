<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePromotion;
use App\Http\Resources\PromotionResource;
use App\Models\Promotion;
use Illuminate\Http\Request;

class PromotionController extends Controller
{
    public function index()
    {
        return PromotionResource::collection(Promotion::all());
    }

    public function show(Request $request, Promotion $promotion)
    {
        return new PromotionResource($promotion);
    }

    public function store(Request $request)
    {
        $this->authorize('update', Promotion::class);

        $validated = $this->validator($request);

        $promotion = Promotion::create($validated);

        return (new PromotionResource($promotion))->response()->setStatusCode(201);
    }

    public function update(Request $request, Promotion $promotion)
    {
        $this->authorize('update', $promotion);

        $validated = $this->validator($request);

        $promotion->update($validated);

        return new PromotionResource($promotion);
    }

    public function destroy(Promotion $promotion)
    {
        $this->authorize('delete', $promotion);

        //@TODO: send json response
        if ($promotion->coupons()->count()) {
            flash('Des clients possèdent encore cette promotion')->error();

            return back();
        }
        if ($promotion->subscriptions()->count()) {
            flash('Des abonnements utilisent encore cette promotion')->error();

            return back();
        }

        $promotion->delete();

        return response()->json();
    }

    private function validator(Request $request)
    {
        return $request->validate([
            'name'=>'required|max:255',
            'value'=>'required|numeric|min:0',
            'is_percentage'=>'required|boolean',
            'products_id'=>'nullable',
            'products_id.*'=>'exists:products,id',
            'is_on_client'=>'required|boolean',
            'code'=>'max:255|nullable',
            'start_date'=>'date|nullable',
            'end_date'=>'date|nullable',
            'is_on_invoice_total'=>'boolean',
        ]);
    }
}
