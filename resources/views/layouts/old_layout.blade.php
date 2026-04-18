<!DOCTYPE html>
<!--
This is a starter template page. Use this page to start your new project from
scratch. This page gets rid of all links and provides the needed markup only.
-->
<html>

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>@yield('title')</title>
    <!-- Tell the browser to be responsive to screen width -->
    <meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">

    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css"
        integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css">
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.2/css/all.css"
        integrity="sha384-oS3vJWv+0UjzBfQzYUhtDYW+Pj2yciDJxpsK1OYPAYjqT085Qq/1cq5FLXAZQ7Ay" crossorigin="anonymous">
    <!-- Ionicons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/ionicons/2.0.1/css/ionicons.min.css">
    <!-- Theme style -->
    <link rel="stylesheet" href="/adminlte/css/AdminLTE.min.css">
    <!-- AdminLTE Skins. We have chosen the skin-blue for this starter
        page. However, you can choose any other skin. Make sure you
        apply the skin class to the body tag so the changes take effect. -->
    <link rel="stylesheet" href="/adminlte/css/skins/skin-black.min.css">

    @yield('css')

    <!-- HTML5 Shim and Respond.js IE8 support of HTML5 elements and media queries -->
    <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
    <!--[if lt IE 9]>
  <script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
  <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
  <![endif]-->

    <!-- Google Font -->
    <link rel="stylesheet"
        href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,600,700,300italic,400italic,600italic">
</head>

<body class="hold-transition skin-black sidebar-mini">
    <div class="wrapper">

        <!-- Main Header -->
        <header class="main-header">

            <!-- Logo -->
            <a href="/" class="logo">
                <!-- mini logo for sidebar mini 50x50 pixels -->
                <span class="logo-mini"><b>RDC</b></span>
                <!-- logo for regular state and mobile devices -->
                <span class="logo-lg"><b>Route de Champlain</b></span>
            </a>

            <!-- Header Navbar -->
            <nav class="navbar navbar-static-top" role="navigation" style="height:50px; padding: 0">
                <!-- Sidebar toggle button-->
                <a href="#" class="sidebar-toggle" data-toggle="push-menu" role="button">
                    <span class="sr-only">Toggle navigation</span>
                </a>

                <div class="navbar-custom-menu">
                    <ul class="nav navbar-nav">

                        <li>
                            <a href="{{ route('logout') }}"
                                onclick="event.preventDefault(); document.getElementById('frm-logout').submit();"
                                title="Déconnexion">
                                <i class="fa fa-power-off"></i>
                            </a>
                            <form id="frm-logout" action="{{ route('logout') }}" method="POST" style="display: none;">
                                {{ csrf_field() }}
                            </form>
                        </li>

                    </ul>
                </div>

            </nav>
        </header>
        <!-- Left side column. contains the logo and sidebar -->
        <aside class="main-sidebar">

            <!-- sidebar: style can be found in sidebar.less -->
            <section class="sidebar">

                {{-- <!-- Sidebar user panel (optional) --> --}}
                {{-- <div class="user-panel"> --}}
                {{-- <div class="pull-left image"> --}}
                {{-- <img src="adminlte/img/user2-160x160.jpg" class="img-circle" alt="User Image"> --}}
                {{-- </div> --}}
                {{-- <div class="pull-left info"> --}}
                {{-- <p>Alexander Pierce</p> --}}
                {{-- <!-- Status --> --}}
                {{-- <a href="#"><i class="fa fa-circle text-success"></i> Online</a> --}}
                {{-- </div> --}}
                {{-- </div> --}}

                {{-- <!-- search form (Optional) --> --}}
                {{-- <form action="#" method="get" class="sidebar-form"> --}}
                {{-- <div class="input-group"> --}}
                {{-- <input type="text" name="q" class="form-control" placeholder="Search..."> --}}
                {{-- <span class="input-group-btn"> --}}
                {{-- <button type="submit" name="search" id="search-btn" class="btn btn-flat"><i class="fa fa-search"></i> --}}
                {{-- </button> --}}
                {{-- </span> --}}
                {{-- </div> --}}
                {{-- </form> --}}
                {{-- <!-- /.search form --> --}}

                <!-- Sidebar Menu -->
                <ul class="sidebar-menu" data-widget="tree">


                    <li><a href="/clients"><i class="fa fa-id-card"></i><span>Clients</span></a></li>

                    <li><a href="{{ route('boatCategories') }}"><i class="fa fa-anchor"></i><span>Categories de
                                bateaux</span></a></li>

                    <li><a href="{{ route('products.index') }}"><i class="fa fa-ship"></i><span>Produits</span></a></li>

                    <li><a href="/subscriptions"><i class="fas fa-dharmachakra"></i><span>Abonnements</span></a></li>

                    <li><a href="/carts/create"><i class="fas fa-cash-register"></i><span>Caisse</span></a></li>

                    <li><a href="{{ route('promotions.index') }}"><i
                                class="fab fa-angellist"></i><span>Promotions</span></a></li>

                    {{-- <li class="header">HEADER</li> --}}
                    {{-- <!-- Optionally, you can add icons to the links --> --}}
                    {{-- <li class="active"><a href="#"><i class="fa fa-link"></i> <span>Link</span></a></li> --}}
                    {{-- <li><a href="#"><i class="fa fa-link"></i> <span>Another Link</span></a></li> --}}
                    {{-- <li class="treeview"> --}}
                    {{-- <a href="#"><i class="fa fa-link"></i> <span>Multilevel</span> --}}
                    {{-- <span class="pull-right-container"> --}}
                    {{-- <i class="fa fa-angle-left pull-right"></i> --}}
                    {{-- </span> --}}
                    {{-- </a> --}}
                    {{-- <ul class="treeview-menu"> --}}
                    {{-- <li><a href="#">Link in level 2</a></li> --}}
                    {{-- <li><a href="#">Link in level 2</a></li> --}}
                    {{-- </ul> --}}
                    {{-- </li> --}}
                </ul>
                <!-- /.sidebar-menu -->
            </section>
            <!-- /.sidebar -->
        </aside>

        <!-- Content Wrapper. Contains page content -->
        <div class="content-wrapper">
            <!-- Content Header (Page header) -->

            <section class="content-header">


                @yield('content_header')

                {{-- <ol class="breadcrumb"> --}}
                {{-- <li><a href="#"><i class="fa fa-dashboard"></i> Level</a></li> --}}
                {{-- <li class="active">Here</li> --}}
                {{-- </ol> --}}
            </section>

            <!-- Main content -->
            <section class="content container-fluid">

                @yield('content')
            </section>

            <footer>

            </footer>



            <!-- /.content -->
        </div>
        <!-- /.content-wrapper -->

        <!-- Main Footer -->
        <footer class="main-footer">
            <!-- To the right -->
            {{-- <div class="pull-right hidden-xs"> --}}

            {{-- <strong>&copy; 2019 La route de Champlain.</strong> --}}
            {{-- </div> --}}
            <!-- Default to the left -->
            @if ($errors->any())
                <div class="alert alert-danger">
                    <ul>
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif
            @include('flash::message')
        </footer>


    </div>

    <!-- REQUIRED JS SCRIPTS -->

    <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"
        integrity="sha384-q8i/X+965DzO0rT7abK41JStQIAqVgRVzpbzo5smXKp4YfRvH+8abtTE1Pi6jizo" crossorigin="anonymous">
    </script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.7/umd/popper.min.js"
        integrity="sha384-UO2eT0CpHqdSJQ6hJty5KVphtPhzWj9WO1clHTMGa3JDZwrnQq4sF86dIHNDz0W1" crossorigin="anonymous">
    </script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js"
        integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM" crossorigin="anonymous">
    </script>
    <!-- AdminLTE App -->
    <script src="/adminlte/js/adminlte.min.js"></script>

    @yield('js')

    <!-- Optionally, you can add Slimscroll and FastClick plugins.
     Both of these plugins are recommended to enhance the
     user experience. -->
</body>

</html>
