<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Models\Product;
use DB;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        if ($request->has('withUnavailable')) {
            $products = Product::all();
        } else {
            $products = Product::available()->get();
        }

        return ProductResource::collection($products);
    }

    public function show(Request $request, Product $product)
    {
        return new ProductResource($product);
    }

    public function store(Request $request)
    {
        $this->authorize('update', Product::class);

        $validated = $this->validator($request);

        $product = Product::create($validated);

        return (new ProductResource($product))->response()->setStatusCode(201);

        return response()->json($product, 201);
    }

    public function update(Request $request, Product $product)
    {
        $this->authorize('update', $product);

        $validated = $this->validator($request);

        $product->update($validated);

        return new ProductResource($product);

        return response()->json($product);
    }

    public function destroy(Product $product)
    {
        $this->authorize('delete', $product);

        abort_if($product->tickets()->count(), 422, 'Des clients possèdent encore ce produit');

        $product->delete();

        return response()->json();
    }

    private function validator(Request $request)
    {
        return $request->validate([
            'name' => 'required|string|min:1|max:50',
            'price'=>'required|numeric',
            'boat_category_id'=>'nullable|exists:boat_categories,id',
            'duration'=>'nullable|integer|min:0|max:720',
            'is_rental'=>'required|boolean',
            'is_initiation'=>'required|boolean',
            'required_subscription_id'=>'nullable|exists:subscriptions,id',
            'required_products_id'=>'nullable',
            'required_products_id.*'=>'exists:products,id',
            'replace_products_id'=>'nullable',
            'replace_products_id.*'=>'exists:products,id',
            'max_passenger'=>'required|min:0|numeric|max:100',
            'is_taxable'=>'required|boolean',
            'is_child'=>'required|boolean',
            'is_teen'=>'required|boolean',
            'is_adult'=>'required|boolean',
            'available_points_of_sale_ids'=>'required|array',
            'available_points_of_sale_ids.*' => 'exists:points_of_sale,id',
            'is_full_boat'=>'required|boolean',
        ]);
    }
}
