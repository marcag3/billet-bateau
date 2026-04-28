<?php

namespace App\Models;

use Database\Factories\TemplateDayFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TemplateDay extends Model
{
    /** @use HasFactory<TemplateDayFactory> */
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'program_id',
        'name',
        'created_at',
        'updated_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'program_id');
    }

    public function slots(): HasMany
    {
        return $this->hasMany(TemplateDaySlot::class, 'template_day_id');
    }

    public function dates(): HasMany
    {
        return $this->hasMany(TemplateDayDate::class, 'template_day_id');
    }
}
