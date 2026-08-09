<?php

namespace App\Events;

use App\Models\Sale;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PrintReceipt implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(public Sale $sale)
    {
        //
    }

    public function broadcastAs(): string
    {
        return 'print-reciept';
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
                'id' => str_pad($this->sale->invoice_id, 5, "0", STR_PAD_LEFT) . "-BKT-" . substr($this->sale->fiscal_year, 1),
                'date' => $this->sale->date,
                'title' => $this->sale->title,
                'total' => $this->sale->total,
                'discount' => $this->sale->discount,
                'taxable_amount' => $this->sale->taxable_amount,
                'vat_amount' => $this->sale->vat_amount,
                'grand_total' => $this->sale->grand_total,
                'sale_items' => $this->sale->sale_items()->get()->map(fn($item) => [
                    'item' => [
                        'name' => $item->item->name
                    ],
                    'price' => $item->price,
                    'quantity' => $item->quantity
                ]),
                'customer' => [
                    'name' => $this->sale->customer?->name,
                    'phone' => $this->sale->customer?->phone,
                ]
            ]
        ];
    }
}
