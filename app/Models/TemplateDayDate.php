<?php

namespace App\Models;

use Database\Factories\TemplateDayDateFactory;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemplateDayDate extends Model
{
    /** @use HasFactory<TemplateDayDateFactory> */
    use HasFactory;

    use HasUlids;

    protected $fillable = [
        'id',
        'program_id',
        'template_day_id',
        'service_date',
        'created_at',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'service_date' => 'date',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'program_id');
    }

    public function templateDay(): BelongsTo
    {
        return $this->belongsTo(TemplateDay::class, 'template_day_id');
    }
}
