@extends('layouts/layout')

@section('title', 'Utilisateurs')



@section('top_buttons')


@endsection


@component('layouts.datatables',['data'=>$users,'model'=>'users','columns'=>[
    ['title'=>"Nom",                            "data"=>"name"],
    ['title'=>"Courriel",                            "data"=>"email"],
],
'moneyColumns'=>[],
'intColumns'=>[],
'decimalColumns'=>[],
'orderColumn'=>0
])

@endcomponent
