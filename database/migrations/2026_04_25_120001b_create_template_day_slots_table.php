<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
    }
};
