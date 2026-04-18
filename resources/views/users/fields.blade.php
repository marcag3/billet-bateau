<!-- Name Field -->
<div class="form-group col-sm-12">
    {{ Form::label('name', 'Nom: ') }}
    {{ Form::text('name', null, ['class' => 'form-control','required'=>'required']) }}
</div>

<!-- Email Field -->
<div class="form-group col-sm-12">
    {{ Form::label('email', 'Courriel: ') }}
    {{ Form::email('email', null, ['class' => 'form-control','required'=>'required']) }}
</div>

<!-- Role Field -->
<div class="form-group col-sm-12">
    {{ Form::label('roles[]', 'Rôles: ') }}
    {{ Form::select('roles[]', $roles, isset($user->roles) ? $user->roles->pluck('id') : null,
    ['class' => 'multiple js-states form-control','multiple'=>'multiple']) }}
</div>


<!-- Submit Field -->
<div class="form-group col-sm-12">
    {{ Form::submit('Sauvegarder', ['class' => 'btn btn-info']) }}
    <a href="{{ URL::previous() }}" class="btn btn-default">Annuler</a>
</div>
