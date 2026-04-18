<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSubscription;
use App\Http\Resources\SubscriptionResource;
use App\Models\Subscription;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function index()
    {
        return SubscriptionResource::collection(Subscription::all());
    }

    public function show(Request $request, Subscription $subscription)
    {
        return new SubscriptionResource($subscription);
    }

    public function store(Request $request)
    {
        $this->authorize('update', Subscription::class);

        $validated = $this->validator($request);

        $subscription = Subscription::create($validated);

        return (new SubscriptionResource($subscription))->response()->setStatusCode(201);
    }

    public function update(Request $request, Subscription $subscription)
    {
        $this->authorize('update', $subscription);

        $validated = $this->validator($request);

        $subscription->update($validated);

        return new SubscriptionResource($subscription);
    }

    public function destroy(Subscription $subscription)
    {
        $this->authorize('delete', $subscription);

        abort_if($subscription->passes()->count(), 422, 'Des clients possèdent encore cet abonnement');

        $subscription->delete();

        return response()->json();
    }

    private function validator(Request $request)
    {
        return $request->validate([
            'name' => 'required|string',
            'price'=>'required|numeric',
            'fiscal_year_expiry'=>'required|boolean',
            'duration'=>'requiredif:fiscal_year_expiry,false|numeric',
            'add_promotion_id'=>'nullable|numeric|exists:promotions,id',
            'is_taxable'=> 'required|boolean',
            'permits_boarding'=>'required|boolean',
            'boat_categories_id'=>'required_if:permits_boarding,true|exists:boat_categories,id|nullable',
            'is_rental'=>'required_if:permits_boarding,true|boolean|nullable',
            'max_passenger'=>'required_if:permits_boarding,true|integer|nullable',
            'is_full_boat'=>'required_if:permits_boarding,true|boolean|nullable',
            'available_points_of_sale_ids'=>'required|array',
            'available_points_of_sale_ids.*' => 'exists:points_of_sale,id',

        ]);
    }
}
