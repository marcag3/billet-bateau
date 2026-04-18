<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Http\Resources\PaymentResource;
use App\Models\Invoice;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Square\Models;
use Square\SquareClient;

class SquarePaymentController extends Controller
{
    public function index()
    {
        //
    }

    public function store(Request $request, SquareClient $sqClient, Client $client, Invoice $invoice)
    {
        $this->authorize('create', Payment::class, [$client]);
        $validated = $request->validate([
            'location_id'=>'required|string|max:255',
            'source_id'=>'required|string|max:255',
        ]);
        abort_if(bccomp($invoice->due_amount, '0.01', 2) !== 1, 400, 'due amount must be greater than 0.01$');

        $client->createSquareCustomer();

        $payment = Payment::create([
            'method'=>Payment::INTERNET,
            'payment_date'=>now(),
        ]);

        $paymentsApi = $sqClient->getPaymentsApi();

        $idempotencyKey = uuid_create();
        $amountMoney = new Models\Money;
        $amountMoney->setAmount(bcmul($invoice->due_amount, '100', 0));
        $amountMoney->setCurrency(Models\Currency::CAD);
        $body = new Models\CreatePaymentRequest(
            $validated['source_id'],
            $idempotencyKey,
            $amountMoney
        );

        $body->setAutocomplete(true);
        $body->setCustomerId($client->square_customer_id);
        $body->setLocationId($validated['location_id']);
        $body->setReferenceId($payment->id);
        $body->setStatementDescriptionIdentifier(__('Invoice').' '.$invoice->id);

        $apiResponse = $paymentsApi->createPayment($body);

        if ($apiResponse->isSuccess()) {
            $responsePayment = $apiResponse->getResult()->getPayment();
            $payment->invoicePayments()->create([
                'invoice_id'=>$invoice->id,
                'amount'=>bcdiv($responsePayment->getApprovedMoney()->getAmount(), '100', 2),
            ]);
            $payment->refresh();
            $payment->transaction_reference = $responsePayment->getId();
            $payment->save();

            return response()->json(new PaymentResource($payment), 201);
        } else {
            $payment->delete();
            $body = new Models\CancelPaymentByIdempotencyKeyRequest(
                $idempotencyKey
            );
            $paymentsApi->cancelPaymentByIdempotencyKey($body);

            return response()->json($apiResponse->getErrors(), 500);
        }
    }

    public function callback(Request $request)
    {
        $validated = $request->validate([
            'com_squareup_pos_CLIENT_TRANSACTION_ID'=>'',
            'com_squareup_pos_SERVER_TRANSACTION_ID'=>'',
            'com_squareup_pos_ERROR_CODE'=>'',
            'com_squareup_pos_ERROR_DESCRIPTION'=>'',
        ]);
        Log::info($validated);

        return view('app');
    }

    public function show($id)
    {
        //
    }

    public function update(Request $request, $id)
    {
        //
    }

    public function destroy($id)
    {
        //
    }
}
