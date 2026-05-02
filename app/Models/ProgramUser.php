<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class ProgramUser extends Pivot
{
    protected function casts(): array
    {
        return [
            'role' => 'string',
        ];
    }
}
