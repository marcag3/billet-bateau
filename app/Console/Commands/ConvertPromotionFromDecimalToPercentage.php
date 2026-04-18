<?php

namespace App\Console\Commands;

use App\Models\Promotion;
use Illuminate\Console\Command;

class ConvertPromotionFromDecimalToPercentage extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ConvertPromotionFromDecimalToPercentage';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Multiply percentage promotions value by 100';

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
        $promotions = Promotion::where('is_percentage', true)->get();
        $promotions->each(function ($promotion) {
            $promotion->value = bcmul($promotion->value, 100, 6);
            $promotion->save();
        });

        return Command::SUCCESS;
    }
}
