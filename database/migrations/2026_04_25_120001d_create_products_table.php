<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->foreignUlid('program_id')->constrained('programs')->cascadeOnDelete();
            $table->foreignUlid('boat_type_id')->nullable()->constrained('boat_types')->nullOnDelete();
            $table->foreignUlid('water_route_id')->nullable()->constrained('water_routes')->nullOnDelete();
            $table->unsignedInteger('capacity');
            $table->string('name');
            $table->text('description')->nullable();
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
