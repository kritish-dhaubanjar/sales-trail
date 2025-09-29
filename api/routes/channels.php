<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('pos.{id}', function ($user, $id) {
    return true;
    return (int) $user->id === (int) $id;
});
