@extends('layouts.layout')

@section('title','Modifier un utilisateur')

@section('top_buttons')
        @can('delete users')
        {{ Form::model($user,['route'=>['users.destroy',$user->id],'method'=>'delete']) }}
        {{ Form::submit('Supprimer l\'utilisateur', ['class' => 'btn btn-outline-danger']) }}
        {{ Form::close() }}
        @endcan
        <a href="{{ route('users.index') }}" class="btn btn-default"><i class="fas fa-backward"></i> Retour</a>

@endsection
@section('content')
    <div class="clearfix"></div>
       <div class="card">
           <div class="card-body">
               <div class="row">
                   {{ Form::model($user, ['route' => ['users.update', $user->id], 'method' => 'patch','class'=>'col']) }}

                        @include('users.fields')

                   {{ Form::close() }}
               </div>
           </div>
       </div>

@endsection

@section('js')
    <script>
        $(document).ready(function() {
            $('.multiple').select2({
                placeholder: "Sélectionner les roles...",
                language:"fr",
            });

        });
    </script>
@endsection