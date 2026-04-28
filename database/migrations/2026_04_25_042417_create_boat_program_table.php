<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {

        Schema::create('boat_program', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('boat_id')->constrained('boats')->cascadeOnDelete();
            $table->foreignUlid('program_id')->constrained('programs')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['boat_id', 'program_id']);
        });
    }
};
