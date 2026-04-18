<?php

namespace App\Console\Commands;

use App\Models\Product;
use APp\Subscription;
use Illuminate\Console\Command;

class makeAvailablePOSArray extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'makeAvailablePOSArray';

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
        Product::where('available_points_of_sale_ids', '1')->update(['available_points_of_sale_ids'=>json_encode([1])]);
        Product::where('available_points_of_sale_ids', '0')->update(['available_points_of_sale_ids'=>json_encode([])]);

        return Command::SUCCESS;
    }
}
