<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('voyages', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUlid('trip_id')->nullable()->constrained('trips')->nullOnDelete();
            $table->foreignUlid('water_route_id')->constrained('water_routes')->restrictOnDelete();
            $table->dateTimeTz('scheduled_departure_at')->nullable();
            $table->dateTimeTz('started_at')->nullable();
            $table->dateTimeTz('arrived_at')->nullable();
            $table->string('status', 32);
            $table->timestamps();

            $table->index(['user_id', 'updated_at']);
            $table->index(['trip_id']);
            $table->index(['status']);
        });
    }
};
