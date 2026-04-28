<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('passengers', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('voyage_id')->constrained('voyages')->cascadeOnDelete();
            $table->string('name');
            $table->foreignUlid('booking_id')->nullable()->constrained('bookings')->nullOnDelete();
            $table->foreignUlid('check_in_id')->nullable()->constrained('check_ins')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['voyage_id']);
        });
    }
};
