@extends('layouts.layout')

@section('top_buttons')

    <a href="{{ route('users.index') }}" class="btn btn-default"><i class="fas fa-backward"></i> Retour</a>
    @can('edit users')
    <a href="{{ route('users.edit',$user->id) }}" class="btn btn-info"><i class="fas fa-edit"></i> Éditer</a>
    @endcan
@endsection

@section('content')
        <div class="card">
            <div class="card-body" style="padding-left: 20px">
                {{--<div class="row" style="padding-left: 20px">--}}
                    @include('users.show_fields')

                {{--</div>--}}
            </div>
        </div>
@endsection
