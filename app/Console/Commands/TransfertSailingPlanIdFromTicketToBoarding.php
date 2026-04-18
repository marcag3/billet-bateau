<?php

namespace App\Console\Commands;

use App\Models\Boarding;
use App\Models\Client;
use App\Models\Product;
use App\Models\SailingPlan;
use App\Models\Ticket;
use Illuminate\Console\Command;

class TransfertSailingPlanIdFromTicketToBoarding extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'TransfertSailingPlanIdFromTicketToBoarding';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Take sailing_plan_id informations from tickets
        table and put it in boardings table';

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
        $tickets = Ticket::whereNotNull('sailing_plan_id')->withTrashed()->get();
        $childProductsId = Product::where('name', 'like', '%enfant%')->pluck('id');

        $boardings = Boarding::whereNull('boarding_item_id')->get();

        $boardings->each(function ($boarding) use ($tickets, $childProductsId) {
            $possibleTickets = $tickets
                ->where('client_id', $boarding->client_id)
                ->where('sailing_plan_id', $boarding->sailing_plan_id)
                ->filter(function ($ticket) {
                    $hasNoBoarding = $ticket->boardings->count() === 0;
                    if (! $hasNoBoarding) {
                        $this->info('Removed already matched client product');
                    }

                    return $hasNoBoarding;
                });

            $countPossibleTickets = $possibleTickets->count();

            if ($countPossibleTickets === 1) {
                $possibleTickets->first()->boardings()->save($boarding);
            } elseif ($countPossibleTickets > 1) {
                $firstNonChildrenTicket = $possibleTickets->whereNotIn('product.id', $childProductsId)->first();

                //use the first non children client product to associate with the current boarding
                $firstNonChildrenTicket->boardings()->save($boarding);
                //then create new boardings for the rest of the possible client products
                $possibleTickets->except($firstNonChildrenTicket->id)->each(function ($ticket) use ($boarding) {
                    $ticket->boardings()->create([
                        'client_id'=>$boarding->client_id,
                        'sailing_plan_id'=>$boarding->sailing_plan_id,
                    ]);
                });
            } elseif ($countPossibleTickets === 0) {
                $unusedTickets = $boarding->client->tickets
                    ->whereNull('sailing_plan_id')
                    ->filter(function ($ticket) use ($boarding) {
                        return $ticket->created_at->isSameDay($boarding->sailingPlan->departure);
                    });

                if ($unusedTickets->count() === 1) {
                    $unusedTickets->first()->boardings()->save($boarding);
                }
            }
        });

        if (Ticket::doesntHave('boardings')->whereNotNull('sailing_plan_id')->count() > 0) {
            $this->error('some client products with a already associated sailing plan where not transfered properly to the boardings table');

            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }
}
