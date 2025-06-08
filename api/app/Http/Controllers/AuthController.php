<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required',
            'password' => 'required'
        ]);

        $credentials = $request->only('email', 'password');

        if (Auth::attempt($credentials)) {
            $user = Auth::user();
            $token = $user->createToken('api-token');
            return [
                'status' => 200,
                'token' => $token->plainTextToken
            ];
        } else {
            return response()->json(['message' => 'These credentials do not match our records.'], 401);
        }
    }

    public function logout()
    {
        if (Auth::check()) {
            $user = Auth::user();
            $user->tokens()->delete();
            return ['status' => 200];
        }
    }

    public function user(Request $request)
    {
        return $request->user();
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'current_password' => 'required',
            'new_password' => 'required|min:8|confirmed'
        ]);

        $user = Auth::user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Your current password doesn\'t match our records.'], 403);
        }

        if ($request->email !== $user->email && User::where('email', $request->email)->exists()) {
            return response()->json(['message' => 'This email is already associated with another account.'], 422);
        }

        $user->email = $request->email;
        $user->password = bcrypt($request->new_password);

        $user->save();

        return ['status' => 200];
    }
}
