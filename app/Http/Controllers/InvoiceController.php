<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Config;
use App\Http\Requests\InvoiceRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Notifications\SendInvoice;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;

class InvoiceController extends Controller
{
    public function index(Request $request, ?Client $client = null)
    {
        $this->authorize('viewAny', [Invoice::class, $client]);

        if (get_class(Auth::user()) === Client::class) {
            $invoices = $client->invoices->loadMissing('client', 'invoiceItems', 'invoicePayments');

            return InvoiceResource::collection($invoices);
        }

        $validated = $request->validate([
            'client_id'=>'nullable|exists:clients,id',
        ]);

        $invoices = Invoice::with('client', 'invoiceItems', 'invoicePayments')->orderBy('updated_at', 'desc');

        if (array_key_exists('client_id', $validated)) {
            $invoices = $invoices->where('client_id', $validated['client_id']);
        }
        $invoices = $invoices->get();

        return InvoiceResource::collection($invoices);
    }

    public function show(Request $request, ?client $client, Invoice $invoice)
    {
        $this->authorize('view', [$invoice, $client]);

        return new InvoiceResource($invoice);
    }

    public function store(InvoiceRequest $request, ?Client $client = null)
    {
        $this->authorize('create', [Invoice::class, $client]);

        $validated = $request->validated();

        if (Auth::guard('user')->check()) {
            $validated['user_id'] = Auth::id();
            $invoice = Invoice::create(Arr::only($validated, [
                'client_id',
                'user_id',
                'invoice_date',
                'status',
                'point_of_sale_id',
            ]));
        } else {
            if ($client->activeInvoice) {
                $client->invoices()->draft()->delete();
            }

            $invoice = $client->invoices()->create([
                'status'=>invoice::DRAFT,
                'invoice_date'=>today(),
                'point_of_sale_id'=>$validated['point_of_sale_id'],
            ]);
        }
        $invoice->syncItems($validated['invoice_items']);
        if (array_key_exists('invoice_payments', $validated)) {
            $invoice->syncInvoicePayments($validated['invoice_payments']);
        }

        return (new InvoiceResource($invoice))->response()->setStatusCode(201);
    }

    public function update(InvoiceRequest $request, ?Client $client, Invoice $invoice)
    {
        $this->authorize('update', [$invoice, $client]);

        $validated = $request->validated();
        // TODO: vérifier que chaque type d'item est présent une seule fois dans le panier avec le compte
        // TODO:il faut scanner les billets à l'entré des bateaux et enlever les produits utilisés du compte des clients
        // TODO: quand le plan de route est de retour, il faut indiquer que les clients ont étés guidés
        // TODO: what to do when number of items is negative?

        if (Auth::guard('user')->check()) {
            $validated['user_id'] = auth()->id();
            $invoice->update(Arr::only($validated, [
                'client_id',
                'user_id',
                'invoice_date',
                'status',
                'point_of_sale_id',
            ]));
        }
        $invoice->syncItems($validated['invoice_items']);
        if (array_key_exists('invoice_payments', $validated)) {
            $invoice->syncInvoicePayments($validated['invoice_payments']);
        }

        return new InvoiceResource($invoice);
    }

    public function destroy(Request $request, ?Client $client, Invoice $invoice)
    {
        $this->authorize('delete', [$invoice, $client]);
        $invoice->delete();

        return response()->json();
    }

    public function print(Invoice $invoice, ?Client $client = null)
    {
        $this->authorize('view', [$invoice, $client]);
        $configs = Config::all();

        return view('invoices.print', compact('invoice', 'configs'));
    }

    public function pdf(Request $request, Invoice $invoice)
    {
        if (! $request->hasValidSignature(false)) {
            abort(401);
        }
        $configs = Config::all();

        return view('invoices.print', compact('invoice', 'configs'));
    }

    public function send(Invoice $invoice, ?Client $client = null)
    {
        $this->authorize('view', [$invoice, $client]);
        $invoice->client->notify(new SendInvoice($invoice));

        return new InvoiceResource($invoice);
    }
}
