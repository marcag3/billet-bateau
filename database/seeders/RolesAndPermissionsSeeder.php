<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // create permissions
        Permission::updateOrCreate(['name' => 'view roles']);
        Permission::updateOrCreate(['name' => 'edit roles']);
        Permission::updateOrCreate(['name' => 'delete roles']);
        Permission::updateOrCreate(['name' => 'view clients']);
        Permission::updateOrCreate(['name' => 'edit clients']);
        Permission::updateOrCreate(['name' => 'delete clients']);
        Permission::updateOrCreate(['name' => 'view boats']);
        Permission::updateOrCreate(['name' => 'edit boats']);
        Permission::updateOrCreate(['name' => 'delete boats']);
        Permission::updateOrCreate(['name' => 'view invoices']);
        Permission::updateOrCreate(['name' => 'edit invoices']);
        Permission::updateOrCreate(['name' => 'delete invoices']);
        Permission::updateOrCreate(['name' => 'view payments']);
        Permission::updateOrCreate(['name' => 'edit payments']);
        Permission::updateOrCreate(['name' => 'delete payments']);
        Permission::updateOrCreate(['name' => 'view products']);
        Permission::updateOrCreate(['name' => 'edit products']);
        Permission::updateOrCreate(['name' => 'delete products']);
        Permission::updateOrCreate(['name' => 'view boat categories']);
        Permission::updateOrCreate(['name' => 'edit boat categories']);
        Permission::updateOrCreate(['name' => 'delete boat categories']);
        Permission::updateOrCreate(['name' => 'view promotions']);
        Permission::updateOrCreate(['name' => 'edit promotions']);
        Permission::updateOrCreate(['name' => 'delete promotions']);
        Permission::updateOrCreate(['name' => 'view subscriptions']);
        Permission::updateOrCreate(['name' => 'edit subscriptions']);
        Permission::updateOrCreate(['name' => 'delete subscriptions']);
        Permission::updateOrCreate(['name' => 'view sailing plans']);
        Permission::updateOrCreate(['name' => 'edit sailing plans']);
        Permission::updateOrCreate(['name' => 'delete sailing plans']);
        Permission::updateOrCreate(['name' => 'view users']);
        Permission::updateOrCreate(['name' => 'edit users']);
        Permission::updateOrCreate(['name' => 'delete users']);
        Permission::updateOrCreate(['name' => 'view schedules']);
        Permission::updateOrCreate(['name' => 'edit schedules']);
        Permission::updateOrCreate(['name' => 'delete schedules']);
        Permission::updateOrCreate(['name' => 'view bookings']);
        Permission::updateOrCreate(['name' => 'edit bookings']);
        Permission::updateOrCreate(['name' => 'delete bookings']);
        Permission::updateOrCreate(['name' => 'view points of sale']);
        Permission::updateOrCreate(['name' => 'edit points of sale']);
        Permission::updateOrCreate(['name' => 'delete points of sale']);
        Permission::updateOrCreate(['name' => 'view config']);
        Permission::updateOrCreate(['name' => 'edit config']);
        Permission::updateOrCreate(['name' => 'delete config']);

        Permission::where('name', 'view trips')->delete();
        Permission::where('name', 'edit trips')->delete();
        Permission::where('name', 'delete trips')->delete();
        Permission::where('name', 'view PointOfSale')->delete();

        // create roles and assign created permissions

        Role::updateOrCreate(['name' => 'Chancelier Suprême']);

        Role::updateOrCreate(['name' => 'Maitre Jedi'])
            ->givePermissionTo([
                'view roles',
                'edit roles',
            ]);

        Role::updateOrCreate(['name' => 'Jedi']);
    }
}
