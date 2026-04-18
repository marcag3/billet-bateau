<?php

return[

    'invoice_status'=>[
        1=>'Brouillon',
        2=>'Confirmée',
    ],

    'itemable_type'=>[
        'App\Product' => 'Produit',
        'App\Subscription' => 'Abonnement',
        'App\Promotion' => 'Promotion',
    ],
    'payment_method'=>[
        1=>'Comptant',
        2=>'Carte',
        3=>'Internet',
        4=>'Square pos',
    ],

    'sailing_plan_status'=>[
        1=>'Réservation',
        2=>'Sur l\'eau',
        3=>'De retour',
    ],

    'trip_guided'=>[
        1=>'Obligatoire',
        2=>'Facultatif',
        3=>'Location',
    ],

];
