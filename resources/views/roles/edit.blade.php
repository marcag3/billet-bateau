@extends('layouts.layout')

@section('title','Modifier un rôle')

@section('top_buttons')
    @can('delete roles')
        {{ Form::model($role,['route'=>['roles.destroy',$role->id],'method'=>'delete']) }}
        {{ Form::submit('Supprimer le rôle', ['class' => 'btn btn-outline-danger']) }}
        {{ Form::close() }}
    @endcan
        <a href="{{ route('roles.index') }}" class="btn btn-default"><i class="fas fa-backward"></i> Retour</a>

@endsection

@section('content')
    <div class="card">
       <div class="card-body">
           <div class="row">
               {{ Form::model($role, ['route' => ['roles.update', $role->id], 'method' => 'patch','class'=>'col']) }}

                    @include('roles.fields')

               {{ Form::close() }}
           </div>
       </div>
    </div>


@endsection
