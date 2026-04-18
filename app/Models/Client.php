<?php

namespace App\Models;

use Antonrom\ModelChangesHistory\Traits\HasChangesHistory;
use App\Models\Boarding;
use App\Models\Booking;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\SailingPlan;
use App\Models\Subscription;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\App;
use Laravel\Scout\Searchable;
use Spatie\Permission\Traits\HasRoles;
use Square\Models;
use Square\SquareClient;

/**
 * Class client
 * @version May 11, 2019, 12:37 am UTC
 *
 * @property string firstName
 * @property string name
 * @property string address
 * @property string apartment
 * @property string city
 * @property string postalCode
 * @property string homephone
 * @property string cellphone
 * @property string email
 * @property string birthday
 * @property string emergencyContact
 * @property string emergencyPhone
 * @property string note
 */
class Client extends Authenticatable
{
    use SoftDeletes;
    use Searchable;
    use HasFactory;
    use Notifiable;
    use HasRoles;
    use HasChangesHistory;

    protected $casts = [
        'birthday' => 'date:Y-m-d',
    ];

    protected $guarded = [];

    protected $appends = [
        // 'is_member',
        'full_name',
        // 'coupons',
        // 'tickets',
        // 'is_guided'
    ];

    // protected $with = [
    //     'passes.subscription',
    //     'coupons.promotion',
    //     'tickets.product'
    // ];

    //GETTERS

    public function getActiveInvoiceIdAttribute()
    {
        return $this->activeInvoice->id ?? null;
    }

    public function getActiveInvoiceAttribute()
    {
        return $invoice = $this->invoices()->active()->first();
    }

    public function getIsGuidedAttribute()
    {
        // $this->loadCount('initiationSailingPlan');
        return $this->initiation_sailing_plan_id > 0;
    }

    public function getFullNameAttribute()
    {
        return $this->firstName.' '.$this->name;
    }

    public function getIdentifierAttribute()
    {
        return $this->id.' '.$this->firstName.' '.$this->name;
    }

    public function getIsMemberAttribute()
    {
        return $this->subscriptions->where('id', 1)->count() > 0;
    }

    public function getIsProfileCompleteAttribute()
    {
        if ($this->wants_to_rent) {
            $idCard = $this->identification_card_number && $this->identification_card_type;
        } else {
            $idCard = true;
        }

        return $idCard && $this->name && $this->firstName && ($this->cellphone || $this->homephone) && $this->emergencyContact && $this->emergencyPhone;
    }

    public function getWantsToRentAttribute()
    {
        if ($this->is_guided) {
            return true;
        }
        if ($this->subscriptions->where('is_rental', true)->count()) {
            return true;
        }
        if ($this->products->where('is_rental', true)->count()) {
            return true;
        }
        if ($this->bookings->where('is_guided', false)->count()) {
            return true;
        }
        if ($this->active_invoice) {
            if ($this->active_invoice->products()->where('is_rental', true)->count()) {
                return true;
            }
            if ($this->active_invoice->subscriptions()->where('is_rental', true)->count()) {
                return true;
            }
        }

        return false;
    }

    public function getHasUnconfirmedBookingAttribute()
    {
        if ($this->bookings->whereNull('confirmed_at')->count()) {
            return true;
        }

        return false;
    }

    public function getHasProductWithoutBookingAttribute()
    {
        if ($this->tickets->whereNull('booking_id')->count()) {
            return true;
        }

        return false;
    }

    public function getAgeAttribute()
    {
        if ($this->birthday) {
            return today()->diffInYears($this->birthday);
        }

        return null;
    }

    public function getIsChildAttribute()
    {
        if ($this->birthday === null) {
            return null;
        }

        return $this->age >= 0 && $this->age < 12;
    }

    public function getIsTeenAttribute()
    {
        if ($this->birthday === null) {
            return null;
        }

        return  $this->age >= 12 && $this->age < 18;
    }

    public function getIsAdultAttribute()
    {
        if ($this->birthday === null) {
            return null;
        }

        return $this->age >= 18;
    }

    public function getAgeCategoryAttribute()
    {
        if ($this->isChild) {
            return 'child';
        }
        if ($this->is_teen) {
            return 'teen';
        }
        if ($this->is_adult) {
            return 'adult';
        }

        return 'adult';
    }

    //RELATIONS

    public function products()
    {
        return $this->belongsToMany(Product::class, 'tickets')
            ->withPivot('invoice_item_id', 'deleted_at')
            ->wherePivotNull('deleted_at')
            ->withTimestamps();
    }

    public function subscriptions()
    {
        return $this->belongsToMany(Subscription::class, 'passes')
            ->withPivot('expiry_date', 'invoice_item_id', 'deleted_at')
            ->wherePivotNull('deleted_at')
            ->wherePivot('expiry_date', '>=', today())
            ->withTimestamps();
    }

    public function promotions()
    {
        return $this->belongsToMany(Promotion::class, 'coupons')
            ->withPivot('pass_id', 'invoice_item_id', 'deleted_at')
            ->wherePivotNull('invoice_item_id')
            ->wherePivotNull('deleted_at')
            ->withTimestamps();
    }

    public function tickets()
    {
        return $this->hasMany(\App\Models\Ticket::class)->available();
    }

    public function passes()
    {
        return $this->hasMany(\App\Models\Pass::class, 'client_id');
    }

    public function coupons()
    {
        return $this->hasmany(\App\Models\Coupon::class, 'client_id')
            ->whereNull('invoice_item_id');
    }

    public function invoices()
    {
        return $this->hasMany(\App\Models\Invoice::class);
    }

    public function sailingPlans()
    {
        return $this->belongsToMany(SailingPlan::class, 'boardings')
            ->wherePivotNull('deleted_at')
            ->withPivot('boarding_item_id', 'boarding_item_type')
            ->withTimestamps();
    }

    public function initiationSailingPlan()
    {
        return $this->belongsTo(\App\Models\SailingPlan::class, 'initiation_sailing_plan_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    //FUNCTIONS

    public function possibleBoardingSubscriptions(Booking | SailingPlan $tour)
    {
        return $this->passes
            ->filter(function ($pass) use ($tour) {
                return $pass->isBoardingPossible($tour);
            })->map(function ($pass) {
                return $pass->subscription;
            });
    }

    // public function chooseBestBoardingItem()
    // {
    //     //pick a possible subscription then the cheapest product
    //     $subscriptions = $this->findPossibleBoardingSubscriptions();
    //     if($subscriptions->count() > 0) return $subscriptions->first();

    //     $products = $this->findPossibleBoardingProducts();
    //     return $products->sortBy('price')->first();
    // }

    public function toSearchableArray()
    {
        $array['id'] = $this->id;
        $array['client_id'] = strval($this->id); //Allow to search on the IDs
        $array['full_name'] = $this->full_name;
        $array['name'] = $this->name;
        $array['firstName'] = $this->firstName;
        $array['address'] = $this->address;
        $array['homephone'] = $this->homephone;
        $array['cellphone'] = $this->cellphone;
        $array['email'] = $this->email;

        return $array;
    }

    public static function titleCase($string)
    {
        $word_splitters = [' ', '-', "O'", "L'", "D'", 'St.', 'Mc'];
        $lowercase_exceptions = ['the', 'van', 'den', 'von', 'und', 'der', 'de', 'da', 'of', 'and', "l'", "d'"];
        $uppercase_exceptions = ['III', 'IV', 'VI', 'VII', 'VIII', 'IX'];

        $string = strtolower($string);
        foreach ($word_splitters as $delimiter) {
            $words = explode($delimiter, $string);
            $newwords = [];
            foreach ($words as $word) {
                if (in_array(strtoupper($word), $uppercase_exceptions)) {
                    $word = strtoupper($word);
                } elseif (! in_array($word, $lowercase_exceptions)) {
                    $word = ucfirst($word);
                }

                $newwords[] = $word;
            }

            if (in_array(strtolower($delimiter), $lowercase_exceptions)) {
                $delimiter = strtolower($delimiter);
            }

            $string = implode($delimiter, $newwords);
        }

        return $string;
    }

    public function createSquareCustomer()
    {
        if ($this->square_customer_id) {
            return;
        }
        $sqClient = App::make(SquareClient::class);
        $customersApi = $sqClient->getCustomersApi();

        $body = new Models\CreateCustomerRequest;
        $body->setIdempotencyKey(uuid_create());
        $body->setGivenName($this->firstName);
        $body->setFamilyName($this->name);
        $body->setEmailAddress($this->email);
        $body->setAddress(new Models\Address);
        $body->getAddress()->setAddressLine1($this->address);
        $body->getAddress()->setAddressLine2($this->apartment);
        $body->getAddress()->setLocality($this->city);
        $body->getAddress()->setPostalCode($this->postalCode);
        $body->getAddress()->setCountry(Models\Country::CA);
        $body->setPhoneNumber($this->cellphone ?? $this->homephone);
        $body->setReferenceId($this->id);
        $body->setNote($this->note);

        $apiResponse = $customersApi->createCustomer($body);
        if ($apiResponse->isSuccess()) {
            $response = $apiResponse->getResult();
            $this->square_customer_id = $response->getCustomer()->getId();
            $this->save();

            return $this->square_customer_id;
        } else {
            $errors = $apiResponse->getErrors();
        }
    }
}
