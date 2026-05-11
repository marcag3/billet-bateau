<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ticket_types', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('program_id')->constrained('programs')->cascadeOnDelete();
            $table->string('title');
            $table->integer('price_cents')->nullable();
            $table->boolean('is_pay_what_you_can')->default(false);
            $table->unsignedInteger('min_per_purchase')->default(0);
            $table->unsignedInteger('max_per_purchase')->nullable();
            $table->timestamps();

            $table->index(['program_id', 'updated_at']);
        });
    }
};
