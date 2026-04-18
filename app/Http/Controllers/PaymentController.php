<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Http\Requests\PaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class PaymentController extends Controller
{
    public function index(Request $request, ?Client $client = null)
    {
        $this->authorize('viewAny', [Payment::class, $client]);

        if (get_class(Auth::user()) === Client::class) {
            $payments = $client->payments;

            return PaymentResource::collection($payments);
        }

        $validated = $request->validate([
            'client_id'=>'nullable|exists:clients,id',
        ]);

        $payments = Payment::orderBy('updated_at', 'desc');

        if (array_key_exists('client_id', $validated)) {
            $payments = $payments->where('client_id', $validated['client_id']);
        }
        $payments = $payments->get();

        return PaymentResource::collection($payments);
    }

    public function show(Request $request, ?Client $client, Payment $payment)
    {
        $this->authorize('view', [$payment, $client]);

        return new PaymentResource($payment);
    }

    public function store(PaymentRequest $request, ?Client $client = null)
    {
        $this->authorize('create', [Payment::class, $client]);

        $validated = $request->validated();

        $validated['user_id'] = Auth::id();
        $payment = Payment::create(Arr::only($validated, [
            'method',
            'user_id',
            'payment_date',
            'note',
        ]));
        if ($validated['method'] !== 4) {
            $payment->syncInvoicePayments($validated['invoice_payments']);
        }
        $payment->save();

        return (new PaymentResource($payment))->response()->setStatusCode(201);
    }

    public function update(PaymentRequest $request, ?Client $client, Payment $payment)
    {
        $this->authorize('update', [$payment, $client]);

        $validated = $request->validated();

        $validated['user_id'] = auth()->id();
        $payment->update(Arr::only($validated, [
            'method',
            'user_id',
            'payment_date',
            'note',
        ]));
        $payment->syncInvoicePayments($validated['invoice_payments']);
        $payment->save();

        return new PaymentResource($payment);
    }

    public function destroy(Request $request, ?Client $client, Payment $payment)
    {
        $this->authorize('delete', [$payment, $client]);
        $payment->delete();

        return response()->json();
    }
}
