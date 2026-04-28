<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('template_days', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('program_id')->constrained('programs')->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();

            $table->index(['program_id', 'updated_at']);
        });

        Schema::create('template_day_slots', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('template_day_id')->constrained('template_days')->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('departure_time', 8);
            $table->unsignedInteger('capacity');
            $table->foreignUuid('boat_type_id')->nullable()->constrained('boat_types')->nullOnDelete();
            $table->foreignUuid('water_route_id')->nullable()->constrained('water_routes')->nullOnDelete();
            $table->timestamps();

            $table->index(['template_day_id', 'sort_order']);
            $table->index(['template_day_id', 'departure_time']);
        });

        Schema::create('template_day_dates', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('program_id')->constrained('programs')->cascadeOnDelete();
            $table->foreignUuid('template_day_id')->constrained('template_days')->cascadeOnDelete();
            $table->date('service_date');
            $table->timestamps();

            $table->unique(['template_day_id', 'service_date']);
            $table->index(['program_id', 'service_date']);
        });
    }
};
