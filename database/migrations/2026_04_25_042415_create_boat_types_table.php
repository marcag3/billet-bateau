<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('boat_types', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('program_id')->constrained('programs')->cascadeOnDelete();
            $table->string('name');
            $table->timestamps();

            $table->index(['program_id', 'updated_at']);
        });
    }
};
