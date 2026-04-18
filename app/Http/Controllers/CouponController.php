<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Coupon;
use App\Http\Resources\CouponResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CouponController extends Controller
{
    public function index(Request $request, ?Client $client = null)
    {
        $this->authorize('viewAny', [Coupon::class, $client]);

        if (get_class(Auth::user()) === Client::class) {
            return CouponResource::collection($client->coupons);
        }

        $validated = $request->validate([
            'client_id'=>'nullable|exists:clients,id',
        ]);

        $query = Coupon::query();
        if (array_key_exists('client_id', $validated)) {
            $query = $query->where('client_id', $validated['client_id']);
        }

        return CouponResource::collection($query->get());
    }

    public function show(Request $request, ?Client $client, Coupon $coupon)
    {
        $this->authorize('view', [$coupon, $client]);

        return new CouponResource($coupon);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Coupon::class);

        $validated = $this->validator($request);

        $coupon = Coupon::create($validated);

        return (new CouponResource($coupon))->response()->setStatusCode(201);
    }

    public function update(Request $request, Coupon $coupon)
    {
        $this->authorize('update', $coupon);

        $validated = $this->validator($request);

        $coupon->update($validated);

        return new CouponResource($coupon);
    }

    public function destroy(Coupon $coupon)
    {
        $this->authorize('delete', $coupon);

        $coupon->delete();

        return response()->json();
    }

    protected function validator(Request $request)
    {
        return $request->validate([
            'promotion_id'=>'required|exists:promotions,id',
            'client_id'=>'required|exists:clients,id',
        ]);
    }
}
