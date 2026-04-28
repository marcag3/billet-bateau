<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('water_routes', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('program_id')->constrained('programs')->cascadeOnDelete();
            $table->string('name');
            $table->geometry('trace', subtype: 'LINESTRING', srid: 4326);
            $table->unsignedInteger('duration_minutes');
            $table->timestamps();

            $table->index(['program_id', 'updated_at']);
        });
    }
};
