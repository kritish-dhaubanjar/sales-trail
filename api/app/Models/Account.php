<?php

namespace App\Models;

use Exception;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    use HasFactory;

    protected $fillable = ["name", "opening_balance"];

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function fromAccountTransfer()
    {
        return $this->hasMany(Transfer::class, 'from_account_id');
    }

    public function toAccountTransfer()
    {
        return $this->hasMany(Transfer::class, 'to_account_id');
    }

    public function delete()
    {
        if ($this->fromAccountTransfer()->exists() || $this->toAccountTransfer()->exists()) {
            throw new Exception('This item cannot be deleted because it is associated with transfers.');
        }

        if ($this->toAccountTransfer()->exists()) {
            throw new Exception('This item cannot be deleted because it is associated with transactions.');
        }

        return parent::delete();
    }
}
