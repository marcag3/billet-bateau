<!-- Name Field -->
<div class="row">
    <p>Nom: {{ $role->name }}</p>
</div>

<!-- Created At Field -->
<div class="row">
    <p>Date de création: {{ $role->created_at }}</p>
</div>

<!-- Updated At Field -->
<div class="row">
    <p>Mise à jour: {{ $role->updated_at }}</p>
</div>

@foreach($permissions->chunk(3) as $chunk)
    <div class="row">
        @foreach($chunk as $permission)
            <!--  Field -->
                <div class="col-sm-4">
                    <p>
                        @if($role->hasPermissionTo($permission))
                            <i class="fas fa-check" ></i>
                        @else
                            <i class="far fa-circle"></i>
                        @endif
                        {{ $permission }}
                    </p>
                </div>
        @endforeach
    </div>
@endforeach