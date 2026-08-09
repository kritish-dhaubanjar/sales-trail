<?php

namespace App\Http\Controllers;

use App\Http\Requests\PaginationRequest;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Exception;

class CategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(PaginationRequest $request)
    {
        $data = $request->validated();

        $q = $data['q'] ?? "";
        $page = $data['page'] ?? 1;
        $limit = $data['limit'] ?? 10;
        $categoryType = $data['category_type'] ?? null;

        $query = Category::query();

        if ($q) {
            $query->where(function ($query) use ($q) {
                $query->where('id', 'like', "%$q%")->orWhere('name', 'like', "%$q%");
            });
        }

        if ($categoryType) {
            $query->where('type', $categoryType);
        }

        return $query->orderBy('name', 'asc')
            ->paginate($limit, ['*'], 'page', $page);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCategoryRequest $request)
    {
        $data = $request->validated();

        $item = Category::create($data);

        return $item;
    }

    /**
     * Display the specified resource.
     */
    public function show(Category $category)
    {
        return $category;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCategoryRequest $request, Category $category)
    {
        $data = $request->validated();

        $category->update($data);

        return $category;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Category $category)
    {
        try {
            $category->delete();
        } catch (Exception $error) {
            return response()->json(['message' => $error->getMessage()], 409);
        }

        return $category;
    }
}
