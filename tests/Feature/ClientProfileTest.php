<?php

namespace Tests\Feature;

use App\Models\Client;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class ClientProfileTest extends TestCase
{
    public function test_update_forbidden_field()
    {
        $client = Client::find(11);
        $client->initiation_sailing_plan_id = null;
        $client->save();
        $response = $this
            ->actingAs($client, 'client')
            ->patchJson('/api/clients/'.$client->id, [
                'firstName' => 'bla',
                'name' => 'bla',
                'note' => "c'est ben beau tout ça",
                'initiation_sailing_plan_id'=>'1',
                'nimportequoi'=>'virus',
            ]);
        $response->assertOk()
        ->assertJson([
            'data'=>[
                'firstName' => 'bla',
                'name' => 'bla',
                'note' => "c'est ben beau tout ça",
            ],
        ]);
        $client->refresh();
        $this->assertNull($client->initiation_sailing_plan_id);
    }

    public function test_client_can_view_his_profile()
    {
        $client = Client::find(12);
        $response = $this
            ->actingAs($client, 'client')
            ->getJson('/api/clients/'.$client->id);

        $response->assertOk();
    }
}
