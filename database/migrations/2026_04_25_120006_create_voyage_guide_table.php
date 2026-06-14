<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('voyage_guide', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('voyage_id')->constrained('voyages')->cascadeOnDelete();
            $table->foreignUlid('guide_id')->constrained('guides')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['voyage_id', 'guide_id']);
        });
    }
};
