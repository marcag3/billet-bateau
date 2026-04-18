SELECT invoice_payment.*, payments.*, invoices.* 
FROM invoice_payment
CROSS JOIN payments ON invoice_payment.payment_id = payments.id
CROSS JOIN invoices ON invoice_payment.invoice_id = invoices.id
WHERE payments.payment_date >= '2021-06-01';

SELECT *
FROM invoice_items
CROSS JOIN invoices ON invoice_items.invoice_id = invoices.id
WHERE invoices.invoice_date >= '2021-06-01'