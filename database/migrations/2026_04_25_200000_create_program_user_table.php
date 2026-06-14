<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('program_user', function (Blueprint $table): void {
            $table->foreignUlid('program_id')->constrained('programs')->cascadeOnDelete();
            $table->foreignUlid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role')->default('admin');
            $table->timestamps();

            // PK column order matches membership lookups (user → programs); uniqueness is unchanged vs (program_id, user_id).
            $table->primary(['user_id', 'program_id']);
        });
    }
};
