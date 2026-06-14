<?php

namespace App\Enums;

enum VoyageStatus: string
{
    case Draft = 'draft';
    case Ready = 'ready';
    case Underway = 'underway';
    case Completed = 'completed';
    case Cancelled = 'cancelled';
}
