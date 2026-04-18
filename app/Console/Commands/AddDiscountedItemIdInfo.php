<?php

namespace App\Console\Commands;

use App\Models\InvoiceItem;
use Illuminate\Console\Command;

class AddDiscountedItemIdInfo extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'addDiscountedItemIdInfo';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Add the discounted item id to legacy invoice items elements
        using the product just before (first product with id less than the promotion)
         in the database';

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
        $invoiceItems = InvoiceItem::all();
        $this->info($invoiceItems->count().' Items trouvés');

        $invoiceItems->each(function ($invoiceItem) {
            static $lastProductId = 0;

            if ($invoiceItem->itemable_type === 'App\Product') {
                $lastProductId = $invoiceItem->id;
            } elseif ($invoiceItem->itemable_type === 'App\Promotion') {
                // $this->info('last product id: '.$lastProductId);
                $invoiceItem->discounted_item_id = $lastProductId;
                $invoiceItem->save();
            }
        });

        $this->info('Terminé');

        return Command::SUCCESS;
    }
}
