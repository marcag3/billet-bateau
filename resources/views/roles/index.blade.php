@extends('layouts/layout')

@section('title', 'Rôles')


@section('top_buttons')
    @can('edit roles')
    <a class="btn btn-info pull-right" style="margin-top: -10px;margin-bottom: 5px" href="{{ route('roles.create') }}"><i class="fas fa-plus"></i> Nouveau rôle</a>
    @endcan
@endsection

@component('layouts.datatables',['data'=>$roles,'model'=>'roles','columns'=>[
    ['title'=>"Nom",                            "data"=>"name"],
],
'moneyColumns'=>[],
'intColumns'=>[],
'decimalColumns'=>[],
'orderColumn'=>0
])

@endcomponent
