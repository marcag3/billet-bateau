<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            $table->string('contact_locale', 5)->nullable()->after('contact_email');
            $table->text('cancel_token')->nullable()->after('cancel_token_hash');
            $table->timestamp('departure_reminder_sent_at')->nullable()->after('cancel_token');
        });
    }

    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table): void {
            $table->dropColumn([
                'contact_locale',
                'cancel_token',
                'departure_reminder_sent_at',
            ]);
        });
    }
};
