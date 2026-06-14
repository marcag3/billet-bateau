<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_tickets', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('booking_id')->constrained('bookings')->cascadeOnDelete();
            $table->foreignUlid('ticket_type_id')->constrained('ticket_types')->restrictOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('country');
            $table->jsonb('custom_fields')->default('{}');
            $table->ulid('waiver_confirmation_id')->nullable();
            $table->timestamps();

            $table->index(['booking_id', 'updated_at']);
            $table->index(['ticket_type_id']);
            $table->index(['waiver_confirmation_id']);
        });
    }
};
