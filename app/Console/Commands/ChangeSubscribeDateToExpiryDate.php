<?php

namespace App\Console\Commands;

use App\Models\Pass;
use Illuminate\Console\Command;

class ChangeSubscribeDateToExpiryDate extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ChangeSubscribeDateToExpiryDate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $passes = Pass::all();

        $passes->each(function ($pass) {
            $pass->expiry_date = $pass->expiry_date->addDays($pass->subscription->duration);
            $pass->save();
        });

        return Command::SUCCESS;
    }
}
