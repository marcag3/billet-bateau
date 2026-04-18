<?php

namespace App\Events;

use App\Models\InvoiceItem;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SubscriptionAdded
{
    use Dispatchable;
    use InteractsWithSockets;
    use SerializesModels;

    public $invoiceItem;

    public function __construct(InvoiceItem $invoiceItem)
    {
        $this->invoiceItem = $invoiceItem;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return \Illuminate\Broadcasting\Channel|array
     */
    public function broadcastOn()
    {
        return new PrivateChannel('channel-name');
    }
}
