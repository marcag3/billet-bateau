@extends('layouts/layout')

@section('title', 'Nouveau rôle')

@section('content')
    <div class="card">

        <div class="card-body">
            <div class="row">
                {{Form::open(['route'=>'roles.store','class'=>'col'])}}
                    @include('roles.fields')
                {{Form::close()}}

            </div>
        </div>
    </div>
@endsection
