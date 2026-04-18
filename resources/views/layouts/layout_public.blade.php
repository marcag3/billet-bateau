<!DOCTYPE html>

<html lang="fr">
<head>
    <meta charset="utf-8">

    <meta name="viewport" content="width=device-width, initial-scale=1">

    <meta http-equiv="x-ua-compatible" content="ie=edge">

    <meta name="csrf-token" content="{{ csrf_token() }}">

    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">

    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">

    <link rel="manifest" href="/site.webmanifest">

    <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5">

    <meta name="msapplication-TileColor" content="#da532c">

    <meta name="theme-color" content="#ffffff">

    <title>@yield('title')</title>

    <!--Bootstrap 4-->

    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.5.3/dist/css/bootstrap.min.css"
          integrity="sha384-TX8t27EcRE3e/ihU7zmQxVncDAy5uIKz4rEkgIXeMed4M0jlfIDPvg6uqKI2xXr2" crossorigin="anonymous">


    <!-- Font Awesome Icons -->
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.2/css/all.css"
          integrity="sha384-oS3vJWv+0UjzBfQzYUhtDYW+Pj2yciDJxpsK1OYPAYjqT085Qq/1cq5FLXAZQ7Ay"
          crossorigin="anonymous">

    <!-- Ionicons -->
    <link rel="stylesheet" href="https://code.ionicframework.com/ionicons/2.0.1/css/ionicons.min.css">

    <!-- Google Font: Source Sans Pro -->
    <link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700" rel="stylesheet">

    <!-- Admin LTE -->
    <link rel="stylesheet" href="/adminlte/dist/css/adminlte.min.css">

    <!-- la route de champlain style sheet -->
    <link href="/css/app.css" rel="stylesheet">

    @yield('css')
</head>
<body class="full-image-background">
        @yield('content')


{{--    <script src="/adminlte/plugins/jquery/jquery.min.js" ></script>--}}

        <script src="https://code.jquery.com/jquery-3.5.1.min.js" integrity="sha256-9/aliU8dGd2tb6OSsuzixeV4y/faTqgFtohetphbbj0=" crossorigin="anonymous"></script>

{{--    <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js" integrity="sha256-VazP97ZCwtekAsvgPBSUwPFKdrwD3unUfSGVYrahUqU=" crossorigin="anonymous"></script>--}}

{{--    <script src="/adminlte/plugins/popper/popper.min.js"></script>--}}
    <script src="/adminlte/plugins/bootstrap/js/bootstrap.bundle.min.js"></script>
    <!-- AdminLTE App -->
    <script src="/adminlte/dist/js/adminlte.min.js"></script>

    @yield('js')

</body>
</html>
