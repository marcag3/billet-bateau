<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>La route De Champlain | Facture</title>
    <!-- Tell the browser to be responsive to screen width -->
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" type="text/css" href="/css/app.css" />

</head>


<body onload="window.print();">
    <div class="container-fluid">
        <!-- Main content -->
        <section style="font-size:90%">

            <!-- title row -->
            <div class="row mb-4">
                <h4 class="col">
                    Facture n. {{ $invoice->id }}
                </h4>
                <span class="col text-end">
                    Date: {{ $invoice->invoice_date->toDateString() }}
                </span>
            </div>
            <!-- info row -->
            <div class="row invoice-info mb-4">
                <div class="col invoice-col">
                    Émetteur
                    <address>
                        <strong>La Route De Champlain</strong><br>
                        {{ $invoice->pointOfSale->area->address }},<br>
                        {{ $invoice->pointOfSale->area->city }}, QC
                        {{ $invoice->pointOfSale->area->postalCode }}<br>
                        T: {{ $invoice->pointOfSale->area->telephone }}<br>
                        C: {{ $invoice->pointOfSale->area->email }}
                    </address>
                </div>
                <!-- /.col -->
                <div class="col invoice-col">
                    Destinataire
                    <address>
                        <strong>{{ $invoice->client->fullname }}</strong><br>
                        {{ $invoice->client->address }}
                        {{ $invoice->client->apartment ? 'app: ' . $invoice->client->apartment : '' }}<br>
                        {{ $invoice->client->city }}, QC {{ $invoice->client->postalCode }}<br>
                        T:
                        {{ $invoice->client->cellphone ? $invoice->client->cellphone : $invoice->client->homephone }}<br>
                        C: {{ $invoice->client->email }}
                    </address>
                </div>
                <!-- /.col -->
            </div>
            <!-- /.row -->

            <!-- Table row -->
            <div class="row mb-4">
                <div class="col-12 table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Type</th>
                                <th>Nom</th>
                                <th>Prix unitaire</th>
                                <th>Taxable</th>
                                <th>Quantité</th>
                                <th>Prix</th>
                            </tr>
                        </thead>
                        <tbody>
                            @foreach ($invoice->invoiceItems as $invoiceItem)
                                <tr>
                                    <td>{{ config('enums.itemable_type.' . $invoiceItem->itemable_type) }}</td>
                                    <td>{{ $invoiceItem->itemable->name }}</td>
                                    <td>{{ $invoiceItem->price }}</td>
                                    <td>
                                        @if ($invoiceItem->is_taxable)
                                            <i class="far fa-check-square"></i>
                                        @else
                                            <i class="far fa-square"></i>
                                        @endif
                                    </td>
                                    <td>{{ $invoiceItem->number_of_items }}</td>
                                    <td>{{ bcmul($invoiceItem->number_of_items, $invoiceItem->price, 2) }}</td>
                                </tr>
                            @endforeach

                        </tbody>
                    </table>
                </div>
                <!-- /.col -->
            </div>
            <!-- /.row -->

            <div class="row">
                <!-- accepted payments column -->
                <div class="col-sm-3 col-md-6">
                    <img src="{{ asset('/images/logo+texte.jpg') }}" alt="Logo Route De Champlain"
                        class="shadow mx-auto" style="opacity: .8; display:block;" height="200px">
                </div>
                <!-- /.col -->
                <div class="col">

                    <div class="table-responsive">
                        <table class="table table-borderless">
                            <tr>
                                <th class="fw-normal" style="width:50%">Sous total non taxable:</th>
                                <td>{{ $invoice->non_taxable_subtotal }}$</td>
                            </tr>
                            <tr>
                                <th class="fw-normal" style="width:50%">Sous total taxable:</th>
                                <td>{{ $invoice->taxable_subtotal }}$</td>
                            </tr>
                            <tr>
                                <th class="fw-normal">TPS ({{ $configs->find('TPS_rate')->value * 100 }}%
                                    {{ $configs->find('TPS_number')->value }}):</th>
                                <td>{{ $invoice->tps }}$</td>
                            </tr>
                            <tr>
                                <th class="fw-normal">TVQ ({{ $configs->find('TVQ_rate')->value * 100 }}%
                                    {{ $configs->find('TVQ_number')->value }}):</th>
                                <td>{{ $invoice->tvq }}$</td>
                            </tr>
                            <tr>
                                <th class="">Total:</th>
                                <td class="fw-bold">{{ $invoice->total }}$</td>
                            </tr>
                        </table>
                        {{-- <p class="lead">Paiement dû avant le: {{ $invoice->invoice_date->toDateString() }} --}}
                        </p>
                    </div>
                </div>
                <!-- /.col -->
            </div>
            <!-- /.row -->

            @if ($invoice->invoicePayments->count())
                <!-- title row -->
                <div class="row">
                    <div class="col-12">
                        <h4>
                            Paiements
                        </h4>
                    </div>
                    <!-- /.col -->

                </div>
                <!-- Table row -->
                <div class="row">
                    <div class="col-12 table-responsive">
                        <table class="table table-striped">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Méthode</th>
                                    <th>Montant</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach ($invoice->invoicePayments as $invoicePayment)
                                    <tr>
                                        <td>{{ $invoicePayment->payment->payment_date->isoformat('YYYY-MM-DD') }}
                                        </td>
                                        <td>{{ config('enums.payment_method.' . $invoicePayment->payment->method) }}
                                        </td>
                                        <td>{{ $invoicePayment->formatted_amount }}</td>
                                    </tr>
                                @endforeach

                            </tbody>
                        </table>
                        <p>Montant dû: {{ $invoice->due_amount }} $</p>
                        @if ($invoice->due_amount == 0)<p>Merci!</p> @endif
                    </div>
                    <!-- /.col -->
                </div>
                <!-- /.row -->
            @endif

        </section>
        <!-- /.content -->
    </div>
    <!-- ./wrapper -->
</body>

</html>
