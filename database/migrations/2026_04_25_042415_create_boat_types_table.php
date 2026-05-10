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
            $table->string('banner_object_key')->nullable();
            $table->string('banner_mime_type')->nullable();
            $table->unsignedBigInteger('banner_size_bytes')->nullable();
            $table->string('banner_etag', 128)->nullable();
            $table->timestamp('banner_uploaded_at')->nullable();
            $table->timestamps();

            $table->index(['program_id', 'updated_at']);
        });
    }
};
