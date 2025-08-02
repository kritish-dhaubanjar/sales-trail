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

    public function delete()
    {
        if ($this->transactions()->exists()) {
            throw new Exception('This item cannot be deleted because it is associated with sales.');
        }

        return parent::delete();
    }
}
