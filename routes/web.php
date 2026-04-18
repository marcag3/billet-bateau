<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

use App\Http\Controllers\HomeController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SquarePaymentController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Square\Environment;
use Square\SquareClient;

Auth::routes(['verify' => true]);

Route::get('/', [HomeController::class, 'index'])->name('home');

// member SPA quasar
Route::get('/client/{route?}', function () {
    return view('app');
});
//admin SPA quasar
Route::get('/jedi/{route?}', function () {
    return view('app');
});

Route::get('/square-callback', [SquarePaymentController::class, 'callback']);

if (config('app.env') === 'local') {
    Route::get('/test', function () {
        $client = new SquareClient([
            'accessToken' => config('services.square.accesToken'),
            'environment' => config('app.env') === 'prod' ? Environment::PRODUCTION : Environment::SANDBOX,
        ]);
        $paymentsApi = $client->getPaymentsApi();
        dump($paymentsApi->listPayments()->getResult());
    });
}

Route::middleware(['auth', 'verified'])->group(function () {
    Route::view('/thanks', 'auth.thanks');

    Route::resource('users', UserController::class)->except('create', 'store');

    Route::resource('roles', RoleController::class);
});

Route::middleware(['auth:user'])->name('user.')->group(function () {
    Route::get('/invoices/{invoice}', [InvoiceController::class, 'print'])->name('invoices.print');
});
Route::get('/invoices-pdf/{invoice}', [InvoiceController::class, 'pdf'])->name('invoices.pdf');
