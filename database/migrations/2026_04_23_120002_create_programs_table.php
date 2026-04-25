<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('programs', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('address_id')->nullable()->unique()->constrained('addresses')->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('theme_color', 7);
            $table->boolean('is_active')->default(false);
            $table->string('slug', 255)->unique();
            $table->timestamps();

            $table->index(['user_id', 'updated_at']);
        });
    }
};
