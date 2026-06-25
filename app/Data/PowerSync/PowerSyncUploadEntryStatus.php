<?php

namespace App\Data\PowerSync;

enum PowerSyncUploadEntryStatus: string
{
    case Applied = 'applied';

    case Rejected = 'rejected';
}
