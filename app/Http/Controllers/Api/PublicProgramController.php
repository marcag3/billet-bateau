<?php

namespace App\Http\Controllers\Api;

use App\Data\Programs\PublicProgramData;
use App\Data\Programs\PublicProgramSummaryData;
use App\Http\Controllers\Controller;
use App\Models\Program;
use Spatie\LaravelData\DataCollection;

class PublicProgramController extends Controller
{
    public function index(): DataCollection
    {
        $programs = Program::query()
            ->active()
            ->whereDate('end_date', '>=', now()->toDateString())
            ->orderBy('name')
            ->get();

        return PublicProgramSummaryData::collect($programs, DataCollection::class);
    }

    public function show(Program $program): PublicProgramData
    {
        return PublicProgramData::fromModel($program);
    }
}
