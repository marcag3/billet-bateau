@extends('layouts.layout')

@section('top_buttons')

    <a href="{{ route('roles.index') }}" class="btn btn-default"><i class="fas fa-backward"></i> Retour</a>
    @can('edit roles')
    <a href="{{ route('roles.edit',$role->id) }}" class="btn btn-info"><i class="fas fa-edit"></i> Éditer</a>
    @endcan
@endsection

@section('content')
        <div class="clearfix"></div>
        <div class="card">
            <div class="card-body" style="padding-left: 20px">
                {{--<div class="row" style="padding-left: 20px">--}}
                    @include('roles.show_fields')

                {{--</div>--}}
            </div>
        </div>
@endsection
