<?php

namespace Tests\Feature;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class InvoiceValidationTest extends TestCase
{
    private $clientId = 1;

    private $firstProductId = 2;

    private $secondProductId = 5;

    private $subscriptionId = 1;

    public function test_adding_product_without_needed_subscription()
    {
        $client = Client::find($this->clientId);
        $i = $this->clientId;
        $product = Product::find(5);
        while ($client->subscriptions->where('id', $product->required_subscription_id)->count() !== 0) {
            $i++;
            $client = Client::find($i);
        }
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

        $response->assertUnprocessable();

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
                    [
                        'itemable_id'=>$product->required_subscription_id,
                        'itemable_type'=>'App\Subscription',
                        'number_of_items'=>1,
                    ],
                ],
            ]);

        $response->assertCreated();
    }

    public function test_adding_rental_product_without_being_guided()
    {
        $client = Client::find($this->clientId);
        $i = $this->clientId;
        $product = Product::find(10);
        while ($client->is_guided) {
            $i++;
            $client = Client::find($i);
        }
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

        $response->assertUnprocessable();
    }

    public function test_adding_promotion_not_available()
    {
        $client = Client::find($this->clientId);
        $i = $this->clientId;
        $product = Product::find(5);
        $promotion = Promotion::find(1);
        $subscription = Subscription::find($product->required_subscription_id);
        while ($client->promotions->where('id', $promotion->id)->count() !== 0) {
            $i++;
            $client = Client::find($i);
        }

        if ($client->subscriptions->where('id', $subscription->id)->count() === 0) {
            $client->subscriptions()->attach($subscription, ['expiry_date'=>today()->addDays(365)]);
        }
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
                    [
                        'itemable_id'=>$promotion->id,
                        'itemable_type'=>'App\Promotion',
                        'number_of_items'=>1,
                    ],
                ],
            ]);

        $response->assertUnprocessable();
    }

    public function test_adding_promotion_not_applicable()
    {
        $client = Client::find($this->clientId);
        $subscription = Subscription::find($this->subscriptionId);
        $promotion = Promotion::find($subscription->add_promotion_id);
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
                    [
                        'itemable_id'=>$promotion->id,
                        'itemable_type'=>'App\Promotion',
                        'number_of_items'=>1,
                    ],
                ],
            ]);

        $response->assertUnprocessable();
    }
}
