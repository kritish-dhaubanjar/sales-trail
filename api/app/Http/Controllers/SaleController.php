<?php

namespace App\Http\Controllers;

use DateTime;
use DateTimeZone;
use Exception;
use Illuminate\Support\Facades\DB;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Transaction;

use App\Utils\StringUtils;

use App\Http\Requests\StoreSaleRequest;
use App\Http\Requests\PaginationRequest;
use Mike42\Escpos\Printer;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;

class SaleController extends Controller
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

        return Sale::orderBy('created_at', 'desc')
            ->where('date', 'like', "%$q%")
            ->orWhere('description', 'like', "%$q%")
            ->orWhere('id', 'like', "%$q%")
            ->orWhere('title', 'like', "%$q%")
            ->paginate($limit, ['*'], 'page', $page);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreSaleRequest $request)
    {
        $data = $request->validated();

        $discount = $data['discount'];
        $sale_items = $data['items'];
        $sale_transactions = $data['transactions'];
        $total = 0;

        DB::beginTransaction();

        try {
            $items = array_map(function ($item) use (&$total) {
                $amt = ($item['quantity'] * $item['price']);
                $item_total = $amt - ($item['discount'] / 100) * $amt;
                $total += $item_total;

                return new SaleItem([
                    'price' => $item['price'],
                    'item_id' => $item['item_id'],
                    'quantity' => $item['quantity'],
                    'discount' => $item['discount'],
                    'total' => $item_total
                ]);
            }, $sale_items);

            $transactions = array_map(function ($transaction) {
                return new Transaction(['account_id' => $transaction['account_id'], 'amount' => $transaction['amount']]);
            }, $sale_transactions);

            $vat_amount = (13 / 100) * ($total - $discount);

            $sale = Sale::create([
                'date' => $data['date'],
                'title' => $data['title'],
                'description' => $data['description'],
                'total' => $total,
                'discount' => $discount,
                'vat_amount' => $vat_amount,
                'grand_total' => $total - $discount + $vat_amount,
            ]);

            $sale->sale_items()->saveMany($items);
            $sale->transactions()->saveMany($transactions);
        } catch (Exception $error) {
            DB::rollBack();
            throw $error;
        }

        DB::commit();

        return Sale::find($sale->id);
    }

    /**
     * Display the specified resource.
     */
    public function show(Sale $sale)
    {
        return $sale;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(StoreSaleRequest $request, Sale $sale)
    {
        $data = $request->validated();

        $discount = $data['discount'];
        $sale_items = $data['items'];
        $sale_transactions = $data['transactions'];
        $total = 0;

        DB::beginTransaction();

        try {
            $sale->sale_items()->forceDelete();
            $sale->transactions()->forceDelete();

            $items = array_map(function ($item) use (&$total) {
                $amt = ($item['quantity'] * $item['price']);
                $item_total = $amt - ($item['discount'] / 100) * $amt;
                $total += $item_total;

                return new SaleItem([
                    'price' => $item['price'],
                    'item_id' => $item['item_id'],
                    'quantity' => $item['quantity'],
                    'discount' => $item['discount'],
                    'total' => $item_total
                ]);
            }, $sale_items);

            $transactions = array_map(function ($transaction) {
                return new Transaction(['account_id' => $transaction['account_id'], 'amount' => $transaction['amount']]);
            }, $sale_transactions);

            $vat_amount = (13 / 100) * ($total - $discount);

            $sale->update([
                'date' => $data['date'],
                'title' => $data['title'],
                'description' => $data['description'],
                'total' => $total,
                'discount' => $discount,
                'vat_amount' => $vat_amount,
                'grand_total' => $total - $discount + $vat_amount,
            ]);

            $sale->sale_items()->saveMany($items);
            $sale->transactions()->saveMany($transactions);
        } catch (Exception $error) {
            DB::rollBack();
            throw $error;
        }

        DB::commit();

        return Sale::find($sale->id);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Sale $sale)
    {
        $sale->delete();

        return $sale;
    }

    public function print(Sale $sale)
    {
        try {
            // 1. Connect to printer (replace with your printer name)
            // $connector = new WindowsPrintConnector("POS-58"); // For Windows
            // $connector = new NetworkPrintConnector("192.168.0.100", 9100); // For network printer
            // $printer = new Printer($connector);

            $connector = new NetworkPrintConnector("192.168.0.241", 9100);

            $printer = new Printer($connector);

            // 2. Print header
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->setEmphasis(true);
            $printer->text("Sushi Time - Bhaktapur\n");
            $printer->setEmphasis(false);
            $printer->text("By: Global Institute Of Hotel Management & Tourism Technical Center Pvt. Ltd\n");
            $printer->setEmphasis(true);
            $printer->text("VAT: 302891803\n");
            $printer->text("TAX INVOICE\n");
            $printer->setEmphasis(false);
            $printer->feed();

            // 3. Print bill info
            $printer->setJustification(Printer::JUSTIFY_LEFT);
            $printer->text("Bill No: $sale->id\n");
            $printer->text("Bill Date: $sale->date\n");
            $printer->text("Buyer's Name: LEAPFROG TECHNOLOGY NEPAL PVT. LTD\n");
            $printer->text("Buyer's PAN: 600243227\n");
            $printer->text("Address: DILLBAZAR, KATHMANDU\n");
            $printer->text("Table No: \n");
            $printer->feed();

            // 4. Print items table
            $printer->setJustification(Printer::JUSTIFY_LEFT);
            $printer->text("SN  ITEM                     QTY   RATE    AMT\n");
            $printer->text("------------------------------------------------\n");

            $sale_items = $sale->sale_items;

            $items = $sale_items->map(function ($item) {
                return [
                    'name' => $item->item->name,
                    'price' => $item->price,
                    'quantity' => $item->quantity,
                    'total' => $item->price * $item->quantity,
                ];
            })->toArray();

            foreach ($items as $index => $item) {
                $sn = str_pad($index + 1, 3, " ", STR_PAD_LEFT);

                $name = str_pad(substr($item['name'], 0, 20), 20, " ", STR_PAD_RIGHT);

                $qty = str_pad($item['quantity'], 3, " ", STR_PAD_LEFT);

                $rate = str_pad(number_format($item['price'], 2), 6, " ", STR_PAD_LEFT);

                $total = str_pad(number_format($item['total'], 2), 6, " ", STR_PAD_LEFT);

                $printer->text("$sn    $name  $qty  $rate  $total\n");
            }

            $printer->text("------------------------------------------------\n");

            // 5. Print totals
            $totals = [
                'Sub Total' => $sale->total,
                'Adj' => $sale->discount,
                'Taxable Amount' => $sale->total - $sale->discount,
                '13% VAT' => $sale->vat_amount,
                'Grand Total' => $sale->total - $sale->discount + $sale->vat_amount,
            ];

            foreach ($totals as $key => $value) {
                $printer->setJustification(Printer::JUSTIFY_RIGHT);
                $printer->text(str_pad($key, 20, " ", STR_PAD_LEFT) . "  " . str_pad(number_format($value, 2), 12, " ", STR_PAD_LEFT) . "\n");
            }

            $printer->feed();

            // 6. Print amount in words
            $printer->setJustification(Printer::JUSTIFY_LEFT);

            $inWords = StringUtils::amountInWords($totals['Grand Total']);

            $printer->text("In Words: $inWords Only\n");
            $printer->feed();

            // 7. Footer
            $nepalTime = new DateTime('now', new DateTimeZone('Asia/Kathmandu'));

            $printer->text("Printed On: " . $nepalTime->format('D M d Y H:i:s') . "\n\n");
            $printer->setJustification(Printer::JUSTIFY_LEFT);
            $printer->text("----------------                ----------------\n");
            $printer->text("Cashier                          Guest Signature\n");
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->text("THANK YOU\n");
            $printer->feed(3);

            // Cut the paper
            $printer->cut();

            // Close printer
            $printer->close();

            return "Invoice sent to printer successfully!";
        } catch (\Exception $e) {
            // $printer->close();
            throw $e;
            return "Couldn't print to printer: " . $e->getMessage();
        }
    }
}
