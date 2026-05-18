<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('programs', function (Blueprint $table): void {
            $table->ulid('id')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('theme_color', 7);
            $table->boolean('is_active')->default(false);
            $table->boolean('is_archived')->default(false);
            $table->string('slug', 255)->unique();
            $table->jsonb('booking_questions')->default('[]');
            $table->string('line_1')->nullable();
            $table->string('line_2')->nullable();
            $table->string('city')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country')->nullable();
            $table->string('banner_object_key')->nullable();
            $table->string('banner_mime_type')->nullable();
            $table->unsignedBigInteger('banner_size_bytes')->nullable();
            $table->string('banner_etag', 128)->nullable();
            $table->timestamp('banner_uploaded_at')->nullable();
            $table->timestamps();
        });
    }
};
