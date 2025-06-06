<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSaleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'date' => 'required|string',
            'discount' => 'required|numeric',
            'title' => 'present|string|nullable',
            'description' => 'present|string|nullable',
            'account_id' => 'required|exists:accounts,id',

            'items' => 'array|required|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.price' => 'required|numeric',
            'items.*.quantity' => 'required|numeric',
            'items.*.discount' => 'required|numeric',
        ];
    }
}
