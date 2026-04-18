@extends('layouts.layout')

@section('title','Route de champlain')


@section('content')
<div class="container">
    <div class="row justify-content-center">
        <div class="col-md-8">
            <div class="card">
                <div class="card-header">Dashboard</div>

                <div class="card-body">
                    <p>Bienvenue</p>

                    @auth
                            <a class="nav-link" href="{{ route('logout') }}"
                               title="Déconnexion"
                               onclick="event.preventDefault();
                               document.getElementById('frm-logout').submit();">
                                <i class="fa fa-power-off"></i>
                                Déconnexion
                            </a>
                    @endauth
                    @guest

                            <a class="nav-link" href="{{ route('login') }}" title="Connexion">
                                <i class="fas fa-key"></i>
                                Connexion
                            </a>

                            <a class="nav-link" href="{{ route('register') }}" title="Enregistrement">
                                <i class="fas fa-user-plus"></i>
                                S'enregistrer
                            </a>

                    @endguest
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
