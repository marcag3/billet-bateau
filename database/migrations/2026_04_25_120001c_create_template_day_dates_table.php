<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('template_day_dates', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('program_id')->constrained('programs')->cascadeOnDelete();
            $table->foreignUlid('template_day_id')->constrained('template_days')->cascadeOnDelete();
            $table->date('service_date');
            $table->timestamps();

            $table->unique(['template_day_id', 'service_date']);
            $table->index(['program_id', 'service_date']);
        });
    }
};
