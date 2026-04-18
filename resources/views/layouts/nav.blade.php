<ul class="nav nav-pills nav-sidebar flex-column" data-widget="treeview" role="menu" data-accordion="false">
    <!-- Add icons to the links using the .nav-icon class
         with font-awesome or any other icon font library -->

    @can('view users')
        <li class="nav-item">
            <a href="{{ route('users.index') }}"
                class="nav-link
                {{ request()->routeIs('users.*') ? 'active' : '' }}">
                <i class="nav-icon fas fa-jedi"></i>
                <p>Utilisateurs</p>
            </a>
        </li>
    @endcan


    @can('view roles')
        <li class="nav-item ">
            <a href="{{ route('roles.index') }}"
                class="nav-link
                {{ request()->routeIs('roles.*') ? 'active' : '' }}">
                <i class="nav-icon fas fa-journal-whills"></i>
                <p>Roles</p>
            </a>
        </li>

    @endcan

</ul>
