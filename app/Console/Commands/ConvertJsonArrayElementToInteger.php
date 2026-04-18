<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Models\Promotion;
use Illuminate\Console\Command;

class ConvertJsonArrayElementToInteger extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'convertToInt';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Convert Json array element referecing foreign id from string to int';

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
        $products = Product::whereNotNull('required_products_id')->orWhereNotNull('replace_products_id')->get();
        $this->info($products->count().' Produits trouvés');

        $products->each(function ($product) {
            if ($product->required_products_id) {
                $product->required_products_id = array_map('intval', $product->required_products_id);
            }
            if ($product->replace_products_id) {
                $product->replace_products_id = array_map('intval', $product->replace_products_id);
            }
            $product->save();
        });

        $promotions = Promotion::whereNotNull('products_id')->get();
        $this->info($promotions->count().' Promotions trouvés');
        $promotions->each(function ($promotion) {
            if ($promotion->products_id) {
                $promotion->products_id = array_map('intval', $promotion->products_id);
            }
            $promotion->save();
        });
        $this->info('Terminé');
    }
}
