<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines contain the default error messages used by
    | the validator class. Some of these rules have multiple versions such
    | as the size rules. Feel free to tweak each of these messages.
    |
    */

    'accepted'             => 'Le champ <strong>:attribute</strong> doit être accepté.',
    'active_url'           => "Le champ <strong>:attribute</strong> n'est pas une URL valide.",
    'after'                => 'Le champ <strong>:attribute</strong> doit être une date postérieure au <strong>:date</strong>.',
    'after_or_equal'       => 'Le champ <strong>:attribute</strong> doit être une date postérieure ou égale au <strong>:date</strong>.',
    'alpha'                => 'Le champ <strong>:attribute</strong> doit contenir uniquement des lettres.',
    'alpha_dash'           => 'Le champ <strong>:attribute</strong> doit contenir uniquement des lettres, des chiffres et des tirets.',
    'alpha_num'            => 'Le champ <strong>:attribute</strong> doit contenir uniquement des chiffres et des lettres.',
    'array'                => 'Le champ <strong>:attribute</strong> doit être un tableau.',
    'before'               => 'Le champ <strong>:attribute</strong> doit être une date antérieure au <strong>:date</strong>.',
    'before_or_equal'      => 'Le champ <strong>:attribute</strong> doit être une date antérieure ou égale au <strong>:date</strong>.',
    'between'              => [
        'numeric' => 'La valeur de <strong>:attribute</strong> doit être comprise entre <strong>:min</strong> et <strong>:max</strong>.',
        'file'    => 'La taille du fichier de <strong>:attribute</strong> doit être comprise entre <strong>:min</strong> et <strong>:max</strong> kilo-octets.',
        'string'  => 'Le texte <strong>:attribute</strong> doit contenir entre <strong>:min</strong> et <strong>:max</strong> caractères.',
        'array'   => 'Le tableau <strong>:attribute</strong> doit contenir entre <strong>:min</strong> et <strong>:max</strong> éléments.',
    ],
    'boolean'              => 'Le champ <strong>:attribute</strong> doit être vrai ou faux.',
    'confirmed'            => 'Le champ de confirmation <strong>:attribute</strong> ne correspond pas.',
    'date'                 => "Le champ <strong>:attribute</strong> n'est pas une date valide.",
    'date_equals'          => 'Le champ <strong>:attribute</strong> doit être une date égale à <strong>:date</strong>.',
    'date_format'          => 'Le champ <strong>:attribute</strong> ne correspond pas au format <strong>:format</strong>.',
    'different'            => 'Les champs <strong>:attribute</strong> et <strong>:other</strong> doivent être différents.',
    'digits'               => 'Le champ <strong>:attribute</strong> doit contenir <strong>:digits</strong> chiffres.',
    'digits_between'       => 'Le champ <strong>:attribute</strong> doit contenir entre <strong>:min</strong> et <strong>:max</strong> chiffres.',
    'dimensions'           => "La taille de l'image <strong>:attribute</strong> n'est pas conforme.",
    'distinct'             => 'Le champ <strong>:attribute</strong> a une valeur en double.',
    'email'                => 'Le champ <strong>:attribute</strong> doit être une adresse email valide.',
    'exists'               => 'Le champ <strong>:attribute</strong> sélectionné est invalide.',
    'file'                 => 'Le champ <strong>:attribute</strong> doit être un fichier.',
    'filled'               => 'Le champ <strong>:attribute</strong> doit avoir une valeur.',
    'gt'                   => [
        'numeric' => 'La valeur de <strong>:attribute</strong> doit être supérieure à <strong>:value</strong>.',
        'file'    => 'La taille du fichier de <strong>:attribute</strong> doit être supérieure à <strong>:value</strong> kilo-octets.',
        'string'  => 'Le texte <strong>:attribute</strong> doit contenir plus de <strong>:value</strong> caractères.',
        'array'   => 'Le tableau <strong>:attribute</strong> doit contenir plus de <strong>:value</strong> éléments.',
    ],
    'gte'                  => [
        'numeric' => 'La valeur de <strong>:attribute</strong> doit être supérieure ou égale à <strong>:value</strong>.',
        'file'    => 'La taille du fichier de <strong>:attribute</strong> doit être supérieure ou égale à <strong>:value</strong> kilo-octets.',
        'string'  => 'Le texte <strong>:attribute</strong> doit contenir au moins <strong>:value</strong> caractères.',
        'array'   => 'Le tableau <strong>:attribute</strong> doit contenir au moins <strong>:value</strong> éléments.',
    ],
    'image'                => 'Le champ <strong>:attribute</strong> doit être une image.',
    'in'                   => 'Le champ <strong>:attribute</strong> est invalide.',
    'in_array'             => "Le champ <strong>:attribute</strong> n'existe pas dans <strong>:other</strong>.",
    'integer'              => 'Le champ <strong>:attribute</strong> doit être un entier.',
    'ip'                   => 'Le champ <strong>:attribute</strong> doit être une adresse IP valide.',
    'ipv4'                 => 'Le champ <strong>:attribute</strong> doit être une adresse IPv4 valide.',
    'ipv6'                 => 'Le champ <strong>:attribute</strong> doit être une adresse IPv6 valide.',
    'json'                 => 'Le champ <strong>:attribute</strong> doit être un document JSON valide.',
    'lt'                   => [
        'numeric' => 'La valeur de <strong>:attribute</strong> doit être inférieure à <strong>:value</strong>.',
        'file'    => 'La taille du fichier de <strong>:attribute</strong> doit être inférieure à <strong>:value</strong> kilo-octets.',
        'string'  => 'Le texte <strong>:attribute</strong> doit contenir moins de <strong>:value</strong> caractères.',
        'array'   => 'Le tableau <strong>:attribute</strong> doit contenir moins de <strong>:value</strong> éléments.',
    ],
    'lte'                  => [
        'numeric' => 'La valeur de <strong>:attribute</strong> doit être inférieure ou égale à <strong>:value</strong>.',
        'file'    => 'La taille du fichier de <strong>:attribute</strong> doit être inférieure ou égale à <strong>:value</strong> kilo-octets.',
        'string'  => 'Le texte <strong>:attribute</strong> doit contenir au plus <strong>:value</strong> caractères.',
        'array'   => 'Le tableau <strong>:attribute</strong> doit contenir au plus <strong>:value</strong> éléments.',
    ],
    'max'                  => [
        'numeric' => 'La valeur de <strong>:attribute</strong> ne peut être supérieure à <strong>:max</strong>.',
        'file'    => 'La taille du fichier de <strong>:attribute</strong> ne peut pas dépasser <strong>:max</strong> kilo-octets.',
        'string'  => 'Le texte de <strong>:attribute</strong> ne peut contenir plus de <strong>:max</strong> caractères.',
        'array'   => 'Le tableau <strong>:attribute</strong> ne peut contenir plus de <strong>:max</strong> éléments.',
    ],
    'mimes'                => 'Le champ <strong>:attribute</strong> doit être un fichier de type : <strong>:values</strong>.',
    'mimetypes'            => 'Le champ <strong>:attribute</strong> doit être un fichier de type : <strong>:values</strong>.',
    'min'                  => [
        'numeric' => 'La valeur de <strong>:attribute</strong> doit être supérieure ou égale à <strong>:min</strong>.',
        'file'    => 'La taille du fichier de <strong>:attribute</strong> doit être supérieure à <strong>:min</strong> kilo-octets.',
        'string'  => 'Le texte <strong>:attribute</strong> doit contenir au moins <strong>:min</strong> caractères.',
        'array'   => 'Le tableau <strong>:attribute</strong> doit contenir au moins <strong>:min</strong> éléments.',
    ],
    'not_in'               => "Le champ <strong>:attribute</strong> sélectionné n'est pas valide.",
    'not_regex'            => "Le format du champ <strong>:attribute</strong> n'est pas valide.",
    'numeric'              => 'Le champ <strong>:attribute</strong> doit contenir un nombre.',
    'present'              => 'Le champ <strong>:attribute</strong> doit être présent.',
    'regex'                => 'Le format du champ <strong>:attribute</strong> est invalide.',
    'required'             => 'Le champ <strong>:attribute</strong> est obligatoire.',
    'required_if'          => 'Le champ <strong>:attribute</strong> est obligatoire quand la valeur de <strong>:other</strong> est <strong>:value</strong>.',
    'required_unless'      => 'Le champ <strong>:attribute</strong> est obligatoire sauf si <strong>:other</strong> est <strong>:values</strong>.',
    'required_with'        => 'Le champ <strong>:attribute</strong> est obligatoire quand <strong>:values</strong> est présent.',
    'required_with_all'    => 'Le champ <strong>:attribute</strong> est obligatoire quand <strong>:values</strong> sont présents.',
    'required_without'     => "Le champ <strong>:attribute</strong> est obligatoire quand <strong>:values</strong> n'est pas présent.",
    'required_without_all' => "Le champ <strong>:attribute</strong> est requis quand aucun de <strong>:values</strong> n'est présent.",
    'same'                 => 'Les champs <strong>:attribute</strong> et <strong>:other</strong> doivent être identiques.',
    'size'                 => [
        'numeric' => 'La valeur de <strong>:attribute</strong> doit être <strong>:size</strong>.',
        'file'    => 'La taille du fichier de <strong>:attribute</strong> doit être de <strong>:size</strong> kilo-octets.',
        'string'  => 'Le texte de <strong>:attribute</strong> doit contenir <strong>:size</strong> caractères.',
        'array'   => 'Le tableau <strong>:attribute</strong> doit contenir <strong>:size</strong> éléments.',
    ],
    'starts_with'          => 'Le champ <strong>:attribute</strong> doit commencer avec une des valeurs suivantes : <strong>:values</strong>',
    'string'               => 'Le champ <strong>:attribute</strong> doit être une chaîne de caractères.',
    'timezone'             => 'Le champ <strong>:attribute</strong> doit être un fuseau horaire valide.',
    'unique'               => 'La valeur du champ <strong>:attribute</strong> est déjà utilisée.',
    'uploaded'             => "Le fichier du champ <strong>:attribute</strong> n'a pu être téléversé.",
    'url'                  => "Le format de l'URL de <strong>:attribute</strong> n'est pas valide.",
    'uuid'                 => 'Le champ <strong>:attribute</strong> doit être un UUID valide',
    'required_subscription' =>  "Vous n'avez pas l'abonnement requis pour ajouter ce produit.",
    'product_not_in_invoice' => "Cette promotion ne s'applique sur aucun produit dans cette facture",
    'promotion_not_in_account' => "Vous n'avez pas cette promotion dans votre compte",
    'need_guided' => "Vous devez avoir été guidé afin d'acheter ce produit",

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | Here you may specify custom validation messages for attributes using the
    | convention "attribute.rule" to name the lines. This makes it quick to
    | specify a specific custom language line for a given attribute rule.
    |
    */

    'custom' => [
        'attribute-name' => [
            'rule-name' => 'custom-message',
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Attributes
    |--------------------------------------------------------------------------
    |
    | The following language lines are used to swap attribute place-holders
    | with something more reader friendly such as E-Mail Address instead
    | of "email". This simply helps us make messages a little cleaner.
    |
    */

    'attributes' => [
        'name'                  => 'nom',
        'username'              => "nom d'utilisateur",
        'email'                 => 'courriel',
        'firstName'            => 'prénom',
        'last_name'             => 'nom',
        'password'              => 'mot de passe',
        'password_confirmation' => 'confirmation du mot de passe',
        'city'                  => 'ville',
        'country'               => 'pays',
        'address'               => 'adresse',
        'phone'                 => 'téléphone',
        'mobile'                => 'portable',
        'age'                   => 'âge',
        'sex'                   => 'sexe',
        'gender'                => 'genre',
        'day'                   => 'jour',
        'month'                 => 'mois',
        'year'                  => 'année',
        'hour'                  => 'heure',
        'minute'                => 'minute',
        'second'                => 'seconde',
        'title'                 => 'titre',
        'content'               => 'contenu',
        'description'           => 'description',
        'excerpt'               => 'extrait',
        'date'                  => 'date',
        'time'                  => 'heure',
        'available'             => 'disponible',
        'size'                  => 'taille',
        'tickets'        => "billets d'embarquement",
        'number_of_minor'       => 'nombre de mineur',
        'route_id'              => 'route',
        'homephone'             =>  'téléphone',
        'cellphone'             =>  'cellulaire',
        'emergencyPhone'        =>  "téléphone d'urgence",
        'apartment'             => 'appartement',
        'postalCode'            => 'code postal',
        'birthday'              => 'date de naissance',
        'emergencyContact'      => "contact d'urgence",
        'passphrase'            => 'Phrase de passe',
        'total_capacity'        => 'capacité totale',
        'teen_capacity'        => "capacité d'ado",
        'child_capacity'        => "capacité d'enfant",
        'wants_to_rent'     =>  'veut louer',
        'identification_card_type'=>"type de la carte d'identification",
        'identification_card_number'=>"numero de la carte d'identification",

    ],

    'values' => [
        'status' => config('enums.trip_status'),
        'wants_to_rent'=>[
            true=>'vrai',
            false=>'faux',
        ],
    ],
];
