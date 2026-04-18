<!-- Name Field -->
<div class="form-group col-sm-12">
    {{ Form::label('name', 'Nom: ') }}
    {{ Form::text('name', null, ['class' => 'form-control','required'=>'required']) }}
</div>

@foreach($permissions->chunk(3) as $chunk)
    <div class="row">
        @foreach($chunk as $key=>$permission)
            <!-- $permission->name Field -->
                <div class="form-group col-sm-4 form-inline">
                    {{ Form::label('permissions[' . $key . ']', $permission . ' : ') }}
                    {{ Form::checkbox('permissions[' . $key . ']', true,
                    isset($role) ? $role->hasPermissionTo($permission) : false,
                    ['class' => 'form-control']) }}
                </div>
        @endforeach
    </div>

@endforeach

<!-- Submit Field -->
<div class="form-group col-sm-12">
    {{ Form::submit('Sauvegarder', ['class' => 'btn btn-info']) }}
    <a href="{{ route('roles.index') }}" class="btn btn-default">Annuler</a>
</div>
