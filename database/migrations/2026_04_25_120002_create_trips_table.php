<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trips', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('program_id')->constrained('programs')->cascadeOnDelete();
            $table->foreignUlid('boat_type_id')->nullable()->constrained('boat_types')->nullOnDelete();
            $table->foreignUlid('water_route_id')->nullable()->constrained('water_routes')->nullOnDelete();
            $table->foreignUlid('template_day_slot_id')->nullable()->constrained('template_day_slots')->nullOnDelete();
            $table->dateTimeTz('scheduled_departure_at');
            $table->unsignedInteger('capacity');
            $table->timestamps();

            $table->index(['program_id', 'scheduled_departure_at']);
            $table->index(['program_id', 'updated_at']);
        });
    }
};
