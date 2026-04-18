<?php

namespace App\Http\Controllers;

use App\Models\Config;
use App\Http\Resources\ConfigResource;
use Illuminate\Http\Request;

class ConfigController extends Controller
{
    public function index()
    {
        return ConfigResource::collection(Config::all());
    }

    public function show(Request $request, Config $config)
    {
        return new ConfigResource($config);
    }

    public function store(Request $request)
    {
        $this->authorize('update', Config::class);

        $validated = $this->validator($request);
        $config = Config::create($validated);

        return (new ConfigResource($config))->response()->setStatusCode(201);
    }

    public function update(Request $request, Config $config)
    {
        $this->authorize('update', $config);
        $validated = $this->validator($request);
        $config->update($validated);

        return new ConfigResource($config);
    }

    public function destroy(Config $config)
    {
        $this->authorize('delete', $config);
        $config->delete();

        return response()->json();
    }

    private function validator(Request $request)
    {
        return $request->validate([
            'key'=>'required|string|max:255',
            'value' => 'required|string|max:255',
        ]);
    }
}
