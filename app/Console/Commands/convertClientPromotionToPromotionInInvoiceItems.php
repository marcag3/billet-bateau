<?php

namespace App\Console\Commands;

use App\Models\Coupon;
use App\Models\InvoiceItem;
use App\Models\Promotion;
use Illuminate\Console\Command;

class convertClientPromotionToPromotionInInvoiceItems extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ClientPromotionToPromotion';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Convert reference to client promotion into promotion in invoice items table';

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
        $invoiceItems = InvoiceItem::where('itemable_type', 'App\ClientPromotion')->get();
        $this->info($invoiceItems->count().' items trouvés');

        $invoiceItems->each(function ($invoiceItem) {
            $coupon = Coupon::find($invoiceItem->itemable_id);
            $promotionId = $coupon->promotion_id;
            $invoiceItem->itemable_id = $promotionId;
            $invoiceItem->itemable_type = 'App\Promotion';
            $invoiceItem->save();
        });

        $this->info('Terminé');

        return Command::SUCCESS;
    }
}
