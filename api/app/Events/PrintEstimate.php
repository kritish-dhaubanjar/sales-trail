<?php

namespace App\Events;

use App\Models\Table;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PrintEstimate implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(public Table $table)
    {
        //
    }

    public function broadcastAs(): string
    {
        return 'print-estimate';
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('print-channel'),
        ];
    }

    public function broadcastWith()
    {
        return [
            'data' => [
                'id' => $this->table->id,
                'name' => $this->table->name,
                'items' => $this->table->items()->get()->map(fn($item) => [
                    'created_at' => $item->created_at,
                    'item' => [
                        'name' => $item->item->name
                    ],
                    'price' => $item->price,
                    'quantity' => $item->quantity
                ]),
            ]
        ];
    }
}
