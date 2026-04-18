<?php

namespace App\Console\Commands;

use App\Models\Client;
use App\Models\Pass;
use App\Models\SailingPlan;
use Carbon\Carbon;
use DB;
use Illuminate\Console\Command;

class importClients extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'import:clients';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'import an php array of clients from the old system';

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
     * @return mixed
     */
    public function handle()
    {
        $this->info('Création d\'un départ par défaut');
        $sailingPlan = new SailingPlan();

        $sailingPlan->departure = new Carbon('01-01-2019');

        $sailingPlan->arrival = $sailingPlan->departure->addSeconds(60 * 60);

        $sailingPlan->status = 3;

        $sailingPlan->number_of_minor = 0;

        $sailingPlan->route_id = 1;

        $sailingPlan->user_id = 1;

        $sailingPlan->save();

        include 'rdc_clients.php';

        $this->info('Importation des clients');
        $bar = $this->output->createProgressBar(count($rdc_clients));

        $bar->start();

        foreach ($rdc_clients as $client) {
            $newClient = Client::create([
                'id'=>$client['ID'],
                'firstName' => $client['PRENOM'],
                'name' => $client['NOM'],
                'address' => $client['ADRESSE'],
                'apartment' => $client['APPARTEMENT'],
                'city' => $client['VILLE'],
                'postalCode' => $client['CODEPOSTAL'],
                'homephone' => $client['TEL_RESIDENCE'],
                'cellphone' => $client['TEL_CELLULAIRE'],
                'email' => $client['COURRIEL'],
                'birthday' => $client['DATE_NAISSANCE'],
                'emergencyPhone' => $client['TEL_URGENCE'],
                'initiation_sailing_plan_id'=> ($client['GUIDE'] == 1 ? $sailingPlan->id : null),
            ]);

            if (isset($client['DATE_INSCRIPTION'])) {
                $pass = $newClient->passes()->create([
                    'subscription_id'=>1,
                    'subscribe_date' => new Carbon($client['DATE_INSCRIPTION']),
                ]);
                if ($client['HEURE_GRATUITE'] == 3) {
                    $pass->coupon()->create([
                        'client_id'=>$newClient->id,
                        'promotion_id'=>1,
                    ]);
                }
            }

            if ($client['TYPE_KAYAK_ILL'] == 1) {
                $newClient->passes()->create([
                    'subscription_id'=>2,
                    'subscribe_date'=>new Carbon($client['DATE_KAYAK_ILL']),
                ]);
            }

            if ($client['TYPE_KAYAK_ILL'] == 2) {
                $newClient->passes()->create([
                    'subscription_id'=>3,
                    'subscribe_date'=>new Carbon($client['DATE_KAYAK_ILL']),
                ]);
            }

            $bar->advance();
        }

        $bar->finish();
        $this->line('');

        $this->info("Importation de l'historique des clients");

        include 'rdc_historique_membres.php';

        $bar = $this->output->createProgressBar(count($rdc_historique_membres));

        $bar->start();

        foreach ($rdc_historique_membres as $historique) {
            Pass::create([
                'subscription_id'=>1,
                'client_id'=>$historique['ID_CLIENT'],
                'subscribe_date'=>$historique['DATE_PAIEMENT'],
            ]);

            $bar->advance();
        }

        $bar->finish();
        $this->line('');
        $this->info('Réussit');
    }
}
