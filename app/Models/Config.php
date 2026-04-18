<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Config extends Model
{
    protected $primaryKey = 'key';

    protected $keyType = 'string';

    protected $guarded = [];

    protected $hidden = [
        'created_at',
        'updated_at',
    ];
}
