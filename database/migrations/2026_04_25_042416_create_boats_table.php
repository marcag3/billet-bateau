<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('boats', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignUlid('boat_type_id')->nullable()->constrained('boat_types')->nullOnDelete();
            $table->foreignUlid('program_id')->constrained('programs')->cascadeOnDelete();
            $table->string('name');
            $table->unsignedInteger('capacity');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['program_id', 'updated_at']);
            $table->index(['user_id', 'updated_at']);
        });
    }
};
