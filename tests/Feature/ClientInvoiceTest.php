<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Config;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class ClientInvoiceTest extends TestCase
{
    private $clientId = 1;

    private $firstProductId = 2;

    private $secondProductId = 5;

    private $subscriptionId = 1;

    public function test_invoice_creation()
    {
        $client = Client::find($this->clientId);
        $product = Product::find($this->firstProductId);
        $response = $this
            ->actingAs($client, 'client')
            ->postJson('/api/clients/'.$client->id.'/invoices', [
                'point_of_sale_id'=>3,
                'invoice_items'=>[
                    [
                        'itemable_id'=>$product->id,
                        'itemable_type'=>'App\Product',
                        'number_of_items'=>1,
                    ],
                ],
            ]);

        $response
            ->assertCreated()
            ->assertJson([
                'data'=> [
                    'client_id'=> $client->id,
                    'clientName'=> $client->full_name,
                    'invoice_date'=> today()->toDateTimeString(),
                    'taxable_subtotal'=> $product->price,
                    'non_taxable_subtotal'=> '0.00',
                    'tps'=> bcmul($product->price, Config::find('tps_rate')->value, 2),
                    'tvq'=> bcmul($product->price, Config::find('tvq_rate')->value, 2),
                    'total'=> bcmul($product->price, 1 + Config::find('tps_rate')->value + Config::find('tvq_rate')->value, 2),
                    'status'=> Invoice::DRAFT,
                    'due_amount'=> bcmul($product->price, 1 + Config::find('tps_rate')->value + Config::find('tvq_rate')->value, 2),
                    'invoice_items'=> [
                        [
                            'itemable_id'=>$product->id,
                            'itemable_type'=>'App\Product',
                            'number_of_items'=>1,
                        ],
                    ],
                    'invoice_payments'=> [],
                ],
            ])
            ->assertJsonMissing(['data'=>['user_id']]);
    }

    /**
     * @depends test_invoice_creation
     */
    public function test_invoice_saved()
    {
        $invoice = Client::find($this->clientId)->activeInvoice;

        $this->assertDatabaseHas('invoices', $invoice->makeHidden([
            'client_name',
            'user_name',
            'invoice_date_formatted',
            'status_formatted',
            'due_amount',
            'invoice_date',
            'taxable_subtotal',
            'non_taxable_subtotal',
            'tps',
            'tvq',
            'total',
        ])->attributesToArray());
    }

    /**
     * @depends test_invoice_creation
     */
    public function test_invoice_update()
    {
        $client = Client::find($this->clientId);
        $invoice = $client->activeInvoice;
        $product = Product::find($this->secondProductId);
        $subscription = Subscription::find($this->subscriptionId);
        $promotion = Promotion::find($subscription->add_promotion_id);

        $response = $this
            ->actingAs($client, 'client')
            ->patchJson('/api/clients/'.$client->id.'/invoices/'.$invoice->id, [
                'point_of_sale_id'=>3,
                'status'=>Invoice::CONFIRMED,
                'invoice_items'=>[
                    [
                        'itemable_id'=>$product->id,
                        'itemable_type'=>'App\Product',
                        'number_of_items'=>3,
                    ],
                    [
                        'itemable_id'=>$subscription->id,
                        'itemable_type'=>'App\Subscription',
                        'number_of_items'=>1,
                    ],
                ], ]);

        $taxableSubtotal = bcmul($product->price, 3, 2);
        $nonTaxableSubtotal = $subscription->price;
        $tps = bcmul($product->price * 3, Config::find('tps_rate')->value, 2);
        $tvq = bcmul($product->price * 3, Config::find('tvq_rate')->value, 2);
        $total = bcadd(bcmul($taxableSubtotal, 1 + Config::find('tps_rate')->value + Config::find('tvq_rate')->value, 2), $nonTaxableSubtotal, 2);

        $response
            ->assertOk()
            ->assertJson([
                'data'=> [
                    'client_id'=> $client->id,
                    'clientName'=> $client->full_name,
                    'invoice_date'=> today()->toDateTimeString(),
                    'taxable_subtotal'=> $taxableSubtotal,
                    'non_taxable_subtotal'=> $nonTaxableSubtotal,
                    'tps'=> $tps,
                    'tvq'=> $tvq,
                    'total'=> $total,
                    'status'=> Invoice::DRAFT,
                    'due_amount'=> $total,
                    'point_of_sale_id'=>3,
                    'invoice_items'=> [
                        [
                            'itemable_id'=>$product->id,
                            'itemable_type'=>'App\Product',
                            'number_of_items'=>3,
                        ],
                        [
                            'itemable_id'=>$subscription->id,
                            'itemable_type'=>'App\Subscription',
                            'number_of_items'=>1,
                        ],

                    ],
                    'invoice_payments'=> [],
                ],
            ])
            ->assertJsonMissing(['data'=>['user_id']]);
    }

    /**
     * @depends test_invoice_update
     */
    public function test_invoice_confirmed_create_client_items()
    {
        $client = Client::find(1);
        $invoice = $client->activeInvoice;

        $invoice->status = Invoice::CONFIRMED;
        $invoice->save();

        $invoice->refresh();
        $client->refresh();

        $this->assertEquals(Invoice::CONFIRMED, $invoice->status);

        $this->assertEquals(3, $invoice->tickets()->where('product_id', $this->secondProductId)->count());
        $this->assertEquals(1, $invoice->passes()->where('subscription_id', 1)->count());
        $this->assertEquals(1, $invoice->passes()->first()->coupon()->count());

        $coupon = $invoice->passes()->first()->coupon;
        $this->assertEquals($client->id, $coupon->client_id);
        $this->assertEquals($invoice->passes()->first()->subscription->add_promotion_id, $coupon->promotion_id);
        $this->assertEquals(null, $coupon->invoice_item_id);
    }

    /**
     * @depends test_invoice_confirmed_create_client_items
     */
    public function test_client_items_dont_duplicate_when_resaving()
    {
        $client = Client::find(1);
        $invoice = $client->invoices()->latest()->first();
        $invoice->save();
        $this->assertEquals(
            3,
            $invoice->tickets()
                ->where('product_id', $this->secondProductId)
                ->get()
                ->count()
        );
    }

    /**
     * @depends test_client_items_dont_duplicate_when_resaving
     */
    public function test_adding_coupon()
    {
        $client = Client::find($this->clientId);
        $subscription = Subscription::find($this->subscriptionId);
        $promotion = Promotion::find($subscription->add_promotion_id);
        $product = Product::find($this->secondProductId);
        $response = $this
            ->actingAs($client, 'client')
            ->postJson('/api/clients/'.$client->id.'/invoices', [
                'point_of_sale_id'=>3,
                'invoice_items'=> [
                    [
                        'itemable_id'=>$product->id,
                        'itemable_type'=>'App\Product',
                        'number_of_items'=>1,
                    ],
                    [
                        'itemable_id'=>$promotion->id,
                        'itemable_type'=>'App\Promotion',
                        'number_of_items'=>1,
                    ],
                ],
            ]);

        $response
        ->assertCreated()
        ->assertJson([
            'data'=> [
                'client_id'=> $client->id,
                'clientName'=> $client->full_name,
                'invoice_date'=> today()->toDateTimeString(),
                'taxable_subtotal'=> '0.00',
                'non_taxable_subtotal'=> '0.00',
                'tps'=> '0.00',
                'tvq'=> '0.00',
                'total'=> '0.00',
                'status'=> Invoice::DRAFT,
                'due_amount'=> '0.00',
                'point_of_sale_id'=>3,
                'invoice_items'=> [
                    [
                        'itemable_id'=>$product->id,
                        'itemable_type'=>'App\Product',
                        'number_of_items'=>1,
                    ],
                    [
                        'itemable_id'=>$promotion->id,
                        'itemable_type'=>'App\Promotion',
                        'number_of_items'=>1,
                    ],
                ],
                'invoice_payments'=> [],
            ],
        ]);
    }

    /**
     * @depends test_adding_coupon
     */
    public function test_removing_a_promotion()
    {
        $client = Client::find($this->clientId);
        $invoice = $client->activeInvoice;
        $product = Product::find($this->secondProductId);
        $subscription = Subscription::find($this->subscriptionId);
        $promotion = Promotion::find($subscription->add_promotion_id);

        $response = $this
            ->actingAs($client, 'client')
            ->patchJson('/api/clients/'.$client->id.'/invoices/'.$invoice->id, [
                'point_of_sale_id'=>3,
                'invoice_items'=>[
                ], ]);
        $response
            ->assertOk()
            ->assertJson([
                'data'=> [
                    'client_id'=> $client->id,
                    'clientName'=> $client->full_name,
                    'invoice_date'=> today()->toDateTimeString(),
                    'taxable_subtotal'=> '0.00',
                    'non_taxable_subtotal'=> '0.00',
                    'tps'=> '0.00',
                    'tvq'=> '0.00',
                    'total'=> '0.00',
                    'status'=> Invoice::DRAFT,
                    'due_amount'=> '0.00',
                    'point_of_sale_id'=>3,
                    'invoice_items'=> [

                    ],
                    'invoice_payments'=> [],
                ],
            ]);

        $response = $this
            ->actingAs($client, 'client')
            ->postJson('/api/clients/'.$client->id.'/invoices', [
                'point_of_sale_id'=>3,
                'invoice_items'=> [
                    [
                        'itemable_id'=>$product->id,
                        'itemable_type'=>'App\Product',
                        'number_of_items'=>1,
                    ],
                    [
                        'itemable_id'=>$promotion->id,
                        'itemable_type'=>'App\Promotion',
                        'number_of_items'=>1,
                    ],
                ],
            ]);
    }

    /**
     * @depends test_removing_a_promotion
     */
    public function test_using_promotion_when_saving()
    {
        $client = Client::find($this->clientId);
        $subscription = Subscription::find($this->subscriptionId);
        $promotion = Promotion::find($subscription->add_promotion_id);

        $countCoupons = $client->promotions->where('id', $promotion->id)->count();

        $invoice = $client->activeInvoice;
        $invoice->status = Invoice::CONFIRMED;
        $invoice->save();

        $invoice->refresh();
        $client->refresh();
        $this->assertEquals(1, $invoice->coupons->count());
        $this->assertEquals($countCoupons - 1, $client->promotions()->where('promotions.id', $promotion->id)->count());
        $coupon = $invoice->coupons()->first();

        $this->assertEquals($client->id, $coupon->client_id);
        $this->assertEquals($promotion->id, $coupon->promotion_id);
    }

    /**
     * @depends test_using_promotion_when_saving
     */
    public function test_invoice_locked_when_confirmed()
    {
        $client = Client::find(1);
        $invoice = $client->invoices()->latest()->first();
        if ($invoice->status !== Invoice::CONFIRMED) {
            $invoice->status = Invoice::CONFIRMED;
            $invoice->save();
        }
        $product = Product::find($this->secondProductId);
        $response = $this
            ->actingAs($client, 'client')
            ->patchJson('/api/clients/'.$client->id.'/invoices/'.$invoice->id, [
                'status'=>Invoice::DRAFT,
                'point_of_sale_id'=>3,
                'invoice_items'=>[
                    [
                        'itemable_id'=>$product->id,
                        'itemable_type'=>'App\Product',
                        'number_of_items'=>5,
                    ],
                ], ]);

        $response->assertForbidden();
    }
}
