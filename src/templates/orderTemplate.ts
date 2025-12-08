export const getOrderTemplate = (order: any) => {
    const statusMap: Record<string, string> = {
        PENDING: 'قيد المراجعة',
        APPROVED: 'تم الموافقة',
        PREPARING: 'قيد التجهيز',
        READY: 'جاهز للتوصيل',
        DELIVERED: 'تم التسليم',
        REJECTED: 'مرفوض',
        // Fallback for potential legacy or unmapped statuses
        REVIEWING: 'قيد المراجعة',
        CANCELLED: 'ملغي',
    };

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleString('ar-EG-u-nu-latn', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
    };

    return `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order #${order.orderNumber}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            font-family: 'Cairo', sans-serif;
        }
        @page {
            size: A4;
            margin: 15mm;
        }
    </style>
</head>
<body class="bg-white text-gray-900 p-6">
    <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="flex justify-between items-center mb-4 border-b pb-3">
            <div>
                <h1 class="text-xl font-bold text-gray-800">تفاصيل الطلب</h1>
                <p class="text-gray-500 text-xs mt-0.5">Order Details</p>
            </div>
            <div class="text-left">
                <p class="text-sm font-bold">#${order.orderNumber}</p>
                <p class="text-[10px] text-gray-500">${formatDate(order.createdAt)}</p>
            </div>
        </div>

        <!-- Order Info -->
        <div class="grid grid-cols-2 gap-3 mb-4 bg-gray-50 p-4 rounded-lg">
            <div>
                <p class="text-[10px] text-gray-500 mb-0.5">القسم / Department</p>
                <p class="font-bold text-sm">${order.department.name}</p>
            </div>
            <div>
                <p class="text-[10px] text-gray-500 mb-0.5">الحالة / Status</p>
                <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold 
                    ${order.status === 'READY' || order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
            order.status === 'REJECTED' || order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}">
                    ${statusMap[order.status] || order.status}
                </span>
            </div>
            ${order.notes ? `
            <div class="col-span-2">
                <p class="text-[10px] text-gray-500 mb-0.5">ملاحظات / Notes</p>
                <p class="text-gray-700 text-xs">${order.notes}</p>
            </div>
            ` : ''}
        </div>

        <!-- Items Table -->
        <div class="mb-4">
            <h2 class="text-base font-bold mb-2 border-b pb-1">المواد المطلوبة / Items</h2>
            <table class="w-full text-right border-collapse text-xs">
                <thead>
                    <tr class="bg-gray-100">
                        <th class="p-1.5 border text-gray-600 font-semibold w-10">#</th>
                        <th class="p-1.5 border text-gray-600 font-semibold">المادة / Item</th>
                        <th class="p-1.5 border text-gray-600 font-semibold w-20">الكمية / Qty</th>
                        <th class="p-1.5 border text-gray-600 font-semibold">ملاحظات / Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items.map((item: any, index: number) => `
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-1.5 border text-center">${index + 1}</td>
                        <td class="p-1.5 border font-medium">${item.itemName}</td>
                        <td class="p-1.5 border text-center font-bold">${item.quantity}</td>
                        <td class="p-1.5 border text-gray-600 text-[10px]">${item.notes || '-'}</td>
                    </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>

        <!-- History -->
        ${order.history && order.history.length > 0 ? `
        <div class="mb-4">
            <h2 class="text-base font-bold mb-2 border-b pb-1">سجل التغييرات / History</h2>
            <div class="space-y-1.5">
                ${order.history.map((record: any) => `
                <div class="flex items-start gap-2 p-1.5 bg-gray-50 rounded border border-gray-100 text-xs">
                    <div class="min-w-[120px] text-[10px] text-gray-500 pt-0.5">
                        ${formatDate(record.timestamp)}
                    </div>
                    <div>
                        <p class="font-medium text-gray-800">
                            ${statusMap[record.status] || record.status}
                            <span class="text-gray-500 text-[10px] font-normal"> - بواسطة ${record.user.name}</span>
                        </p>
                        ${record.notes ? `<p class="text-[10px] text-gray-600 mt-0.5">${record.notes}</p>` : ''}
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
        ` : ''}

        <!-- Footer -->
        <div class="mt-6 text-center text-[10px] text-gray-400 border-t pt-2">
            <p>تم توليد هذا المستند تلقائياً بواسطة نظام OrderLink</p>
            <p>Generated by OrderLink System</p>
        </div>
    </div>
</body>
</html>
    `;
};
