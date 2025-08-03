<?php

namespace App\Http\Requests\Table;

use Illuminate\Foundation\Http\FormRequest;

class CheckoutTableRequest extends FormRequest
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

            'items' => 'array|required|min:1',
            'items.*.item_id' => 'required|exists:items,id',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.quantity' => 'required|numeric|min:0',

            'transactions' => 'array|required|min:1',
            'transactions.*.account_id' => 'required|exists:accounts,id',
            'transactions.*.amount' => 'required|numeric',
        ];
    }
}
