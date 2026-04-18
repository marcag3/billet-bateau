<?php

namespace App\Http\Requests;

use App\Models\Client;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\Subscription;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class InvoiceRequest extends FormRequest
{
    protected $stopOnFirstFailure = true;

    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $rules = [
            'invoice_items'=>'array',
            'invoice_items.*'=>'array',
            'invoice_items.*.itemable_type'=>['required', Rule::in(collect(config('enums.itemable_type'))->keys())],
            'invoice_items.*.itemable_id'=>'required|integer',
            'invoice_items.*.number_of_items'=>'required|integer',
            'point_of_sale_id'=>'required|exists:points_of_sale,id',
        ];
        if (Auth::guard('user')->check()) {
            $rules = $rules + [
                'point_of_sale_id' => 'required|exists:points_of_sale,id',
                'invoice_date'=>'required|date',
                'client_id'=>'required|exists:clients,id',
                'status'=>['required', Rule::in(collect(config('enums.invoice_status'))->keys())],
                'invoice_payments'=>'array',
                'invoice_payments.*'=>'array',
                'invoice_payments.*.payment_id'=>'required|exists:payments,id',
                'invoice_payments.*.amount'=>'required|numeric',
            ];
        }

        return $rules;
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {

            //TODO: create error when user and client account are connected on same browser
            if (Auth::guard('user')->check()) {
                //TODO: evaluate if this is a logic and sane way of checking if we should
                //skip the normal invoice creation check
                // if(Auth::user()->can('update invoices')) return;
                $client = Client::find($validator->validated()['client_id']);
            } else {
                $client = Auth::user();
            }
            //TODO: use cache for products and promotions

            foreach ($validator->validated()['invoice_items'] as $key => $invoiceItem) {
                if ($invoiceItem['itemable_type'] === 'App\Product') {

                    //check for required subscriptions in the invoice and client account
                    $product = Product::find($invoiceItem['itemable_id']);
                    if ($product->required_subscription_id !== null) {
                        $requiredSubscriptionsInClientAccount = $client->subscriptions
                            ->where('id', $product->required_subscription_id)
                            ->count();

                        $requiredSubscriptionsInInvoice = collect($validator->validated()['invoice_items'])
                            ->where('itemable_type', 'App\Subscription')
                            ->where('itemable_id', $product->required_subscription_id)
                            ->count();

                        if ($requiredSubscriptionsInClientAccount + $requiredSubscriptionsInInvoice <= 0) {
                            $validator->errors()
                                ->add('invoice_items.'.$key, __('validation.required_subscription'));
                        }
                    }

                    //check if there is a required product in the invoice
                    if ($product->required_products_id !== null) {
                        //TODO: not sure if we need to constrain this
                        //required products was mainly for adding childs only when a parent was present
                        //but maybe we don't care about that?
                    }

                    //check if client is guided before buying a rental product
                    if ($product->is_rental) {
                        if (! $client->is_guided) {
                            $validator->errors()
                                ->add('invoice_items.'.$key, __('validation.need_guided'));
                        }
                    }
                } elseif ($invoiceItem['itemable_type'] === 'App\Promotion') {
                    //check for client promotion available
                    $promotion = Promotion::find($invoiceItem['itemable_id']);
                    if ($promotion->is_on_client) {
                        $countPromotionsInClientAccount = $client->promotions
                            ->where('id', $promotion->id)
                            ->count();
                        $countPromotionsInInvoice = collect($validator->validated()['invoice_items'])
                            ->where('itemable_type', 'App\Subscription')
                            ->map(function ($item) {
                                return Subscription::find($item['itemable_id'])
                                    ->add_promotion_id;
                            })
                            ->count();
                        if ($countPromotionsInClientAccount + $countPromotionsInInvoice <= 0) {
                            $validator->errors()
                                ->add('invoice_items.'.$key, __('validation.promotion_not_in_account'));
                        }
                    }
                    //check for products present in invoice
                    if (count($promotion->products_id) > 0) {
                        $countApplicableProducts = collect($validator->validated()['invoice_items'])
                            ->where('itemable_type', 'App\Product')
                            ->pluck('itemable_id')
                            ->intersect($promotion->products_id)
                            ->count();

                        if ($countApplicableProducts <= 0) {
                            $validator->errors()
                                    ->add('invoice_items.'.$key, __('validation.product_not_in_invoice'));
                        }
                    } elseif (! $promotion->is_on_invoice) {
                        if (collect($validator->validated()['invoice_items'])
                            ->where('itemable_type', 'App\Product')
                            ->count() === 0) {
                            $validator->errors()
                                    ->add('invoice_items.'.$key, __('validation.product_not_in_invoice'));
                        }
                    }
                }
            }
        });
    }
}
