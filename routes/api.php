<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\AreaController;
use App\Http\Controllers\Auth\ClientLoginController;
use App\Http\Controllers\Auth\LinkController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\BoatCategoryController;
use App\Http\Controllers\BoatInventoryController;
use App\Http\Controllers\BookingCandidateController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\CalendarController;
use App\Http\Controllers\ClientController;
use App\Http\Controllers\ConfigController;
use App\Http\Controllers\CouponController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\PassController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PointOfSaleController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\RouteController;
use App\Http\Controllers\SailingPlanController;
use App\Http\Controllers\SquarePaymentController;
use App\Http\Controllers\StopController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\TripController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

//Authenticated client only
Route::middleware(['auth:client'])->name('client.')->prefix('api')->group(function () {
    Route::post('/logout', [ClientLoginController::class, 'logout'])->name('logout');
    Route::get('/check-login', [ClientLoginController::class, 'checkLogin'])->name('check-login');

    Route::apiResources([
        'clients.invoices.payments'=>SquarePaymentController::class,
        'clients' => ClientController::class,
        'clients.bookings'=>BookingController::class,
        'clients.invoices'=>InvoiceController::class,
    ]);

    Route::apiResources([
        'clients.tickets'=>TicketController::class,
        'clients.passes'=>PassController::class,
        'clients.coupons'=>CouponController::class,
        'configs'=>ConfigController::class,
    ],
    [
        'only'=>['index', 'show'],
    ]);
});

//public access
Route::prefix('api')->name('client.')->group(function () {
    Route::post('/request-pass-phrase', [ClientLoginController::class, 'requestPassPhrase'])->name('request-pass-phrase');
    Route::post('/login', [ClientLoginController::class, 'login']);
    Route::post('/register', [ClientLoginController::class, 'register']);
    Route::get('/login-link', LinkController::class)->name('login-link');

    Route::apiResources([
        'booking-candidates' => BookingCandidateController::class,
        'trips'=>TripController::class,
        'routes'=>RouteController::class,
        'boat-categories'=>BoatCategoryController::class,
        'activities'=>ActivityController::class,
        'stops'=>StopController::class,
        'products'=>ProductController::class,
        'subscriptions'=>SubscriptionController::class,
        'promotions'=>PromotionController::class,
        'points-of-sale'=>PointOfSaleController::class,
        'areas'=>AreaController::class,
    ],
    [
        'only'=>['index', 'show'],
        'parameters'=>['points-of-sale'=>'point_of_sale'],
    ]);
});

//*****************************************************************************************
//authenticated user only
Route::middleware(['auth:user'])->name('user.')->prefix('user-api')->group(function () {
    Route::post('/logout', [LoginController::class, 'logout']);
    Route::get('/check-login', [LoginController::class, 'checkLogin']);
    Route::post('/invoices/{invoice}/send', [App\Http\Controllers\InvoiceController::class, 'send']);

    Route::apiResources([
        'calendars' => CalendarController::class,
        'routes' => RouteController::class,
        'stops' => StopController::class,
        'boat-categories' => BoatCategoryController::class,
        'trips' => TripController::class,
        'sailingPlans' => SailingPlanController::class,
        'booking-candidates' => BookingCandidateController::class,
        'users' => UserController::class,
        'boat-inventories'=>BoatInventoryController::class,
        'activities'=>ActivityController::class,
        'bookings'=>BookingController::class,
        'clients'=>ClientController::class,
        'tickets'=>TicketController::class,
        'passes'=>PassController::class,
        'coupons'=>CouponController::class,
        'products'=>ProductController::class,
        'subscriptions'=>SubscriptionController::class,
        'promotions'=>PromotionController::class,
        'invoices'=>InvoiceController::class,
        'payments'=>PaymentController::class,
        'points-of-sale'=>PointOfSaleController::class,
        'areas'=>AreaController::class,
        'configs'=>ConfigController::class,
    ],
    ['parameters'=>['points-of-sale'=>'point_of_sale']]);
});

//public access
Route::prefix('user-api')->name('user.')->group(function () {
    Route::post('/login', [LoginController::class, 'login']);
    Route::post('/register', [RegisterController::class, 'register']);
});
