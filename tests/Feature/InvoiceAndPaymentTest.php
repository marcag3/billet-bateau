<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class InvoiceAndPaymentTest extends TestCase
{
    public function test_create_invoice_unauthenticated()
    {
        $response = $this->postJson('/user-api/invoices', [
            'point_of_sale_id' => 1,
            'invoice_date'=>today(),
            'client_id'=>14,
            'status'=>Invoice::DRAFT,
        ]);

        $response->assertStatus(401);
    }

    public function test_create_invoice()
    {
        $user = User::find(1);
        $response = $this->actingAs($user, 'user')->postJson('/user-api/invoices', [
            'point_of_sale_id' => 1,
            'invoice_date'=>today()->toDateTimeString(),
            'client_id'=>14,
            'status'=>Invoice::DRAFT,
            'invoice_items'=>[
                0=>[

                    'itemable_type'=>'App\Product',
                    'itemable_id'=>2,
                    'number_of_items'=>1,
                ],
            ],
        ]);

        // $response->dump();

        $response->assertCreated()
        ->assertJson(['data'=>[
            'point_of_sale_id' => 1,
            'invoice_date'=>today()->toDateTimeString(),
            'client_id'=>14,
            'status'=>Invoice::DRAFT,
            'invoice_items'=>[[

                'itemable_type'=>'App\Product',
                'itemable_id'=>2,
                'number_of_items'=>1,
            ],
            ],
        ]]);

        $invoiceTotal = $response->json()['data']['total'];
        $invoiceId = $response->json()['data']['id'];

        $this->assertTrue($response->json()['data']['taxable_subtotal'] < $invoiceTotal);

        $response = $this->actingAs($user, 'user')->postJson('user-api/payments', [
            'method'=>Payment::CARD,
            'payment_date'=>today()->toDateTimeString(),
            'invoice_payments'=>[
                [
                    'invoice_id'=>$invoiceId,
                    'amount'=>$invoiceTotal,
                ],
            ],
        ]);

        // $response->dump();

        $invoice = Invoice::find($invoiceId);

        $this->assertEquals(Invoice::CONFIRMED, $invoice->status);
        $this->assertEquals('0.00', $invoice->due_amount);
    }
}
