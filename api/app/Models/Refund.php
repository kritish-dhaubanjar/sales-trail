<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Refund extends Model
{
    use HasFactory, SoftDeletes;

    protected $with = ['refund_items', 'account'];
    protected $fillable = ["date", "title", "description", "account_id", "total", "discount", "grand_total"];

    public function refund_items(): HasMany
    {
        return $this->hasMany(RefundItem::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function delete()
    {
        $this->refund_items()->delete();
        parent::delete();
    }
}
