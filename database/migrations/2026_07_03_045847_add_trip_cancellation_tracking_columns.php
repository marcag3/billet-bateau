<?php

use App\Enums\VoyageStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('voyages', function (Blueprint $table) {
            $table->string('cancelled_from_status', 32)->nullable()->after('status');
        });

        Schema::table('bookings', function (Blueprint $table) {
            $table->foreignUlid('cancelled_by_voyage_id')
                ->nullable()
                ->after('deleted_at')
                ->constrained('voyages')
                ->nullOnDelete();
        });

        DB::table('voyages')
            ->where('status', VoyageStatus::Cancelled->value)
            ->whereNull('cancelled_from_status')
            ->update(['cancelled_from_status' => VoyageStatus::Ready->value]);
    }
};
