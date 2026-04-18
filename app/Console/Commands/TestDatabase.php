<?php

namespace App\Console\Commands;

use DB;
use Illuminate\Console\Command;

class TestDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test_database';

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
        $this->info(config('database.connections.mysql.host'));
        try {
            DB::connection()->getPDO();
            $this->info(DB::connection()->getDatabaseName());
        } catch (Exception $e) {
            $this->error('no database connection');
            $this->error($e);
        }
    }
}
