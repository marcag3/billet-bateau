<?php

use Illuminate\Support\Facades\DB;
use TimoKoerber\LaravelOneTimeOperations\OneTimeOperation;

return new class extends OneTimeOperation
{
    protected bool $async = true;

    public function process(): void
    {
        DB::table('program_user')
            ->where('role', 'admin')
            ->whereIn('program_id', function ($query): void {
                $query->select('program_id')
                    ->from('program_user')
                    ->groupBy('program_id')
                    ->havingRaw('count(*) = 1');
            })
            ->update(['role' => 'owner']);
    }
};
