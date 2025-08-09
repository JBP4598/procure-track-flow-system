-- Update the existing admin user to have a department
UPDATE profiles 
SET department_id = (SELECT id FROM departments WHERE code = 'PROC' LIMIT 1)
WHERE email = 'joshpensawon@gmail.com';

-- Create sample PPMP files for different departments
INSERT INTO ppmp_files (department_id, fiscal_year, total_budget, uploaded_by, file_name, status) VALUES 
((SELECT id FROM departments WHERE code = 'IT' LIMIT 1), 2024, 500000.00, (SELECT id FROM profiles WHERE email = 'joshpensawon@gmail.com' LIMIT 1), 'IT_PPMP_2024.xlsx', 'approved'),
((SELECT id FROM departments WHERE code = 'HR' LIMIT 1), 2024, 300000.00, (SELECT id FROM profiles WHERE email = 'joshpensawon@gmail.com' LIMIT 1), 'HR_PPMP_2024.xlsx', 'approved'),
((SELECT id FROM departments WHERE code = 'OPS' LIMIT 1), 2024, 750000.00, (SELECT id FROM profiles WHERE email = 'joshpensawon@gmail.com' LIMIT 1), 'Operations_PPMP_2024.xlsx', 'approved');

-- Create sample PPMP items
INSERT INTO ppmp_items (ppmp_file_id, item_name, description, unit, quantity, unit_cost, total_cost, remaining_quantity, remaining_budget, budget_category, procurement_method, schedule_quarter) VALUES 
-- IT Department items
((SELECT id FROM ppmp_files WHERE file_name = 'IT_PPMP_2024.xlsx' LIMIT 1), 'Desktop Computers', 'High-performance desktop computers for developers', 'unit', 20, 25000.00, 500000.00, 20, 500000.00, 'Equipment', 'Public Bidding', 'Q1'),
((SELECT id FROM ppmp_files WHERE file_name = 'IT_PPMP_2024.xlsx' LIMIT 1), 'Software Licenses', 'Development software licenses', 'license', 50, 5000.00, 250000.00, 50, 250000.00, 'Software', 'Direct Contracting', 'Q2'),

-- HR Department items  
((SELECT id FROM ppmp_files WHERE file_name = 'HR_PPMP_2024.xlsx' LIMIT 1), 'Office Furniture', 'Ergonomic office chairs and desks', 'set', 15, 12000.00, 180000.00, 15, 180000.00, 'Furniture', 'Shopping', 'Q1'),
((SELECT id FROM ppmp_files WHERE file_name = 'HR_PPMP_2024.xlsx' LIMIT 1), 'Training Materials', 'Employee development training materials', 'package', 10, 8000.00, 80000.00, 10, 80000.00, 'Training', 'Direct Purchase', 'Q3'),

-- Operations Department items
((SELECT id FROM ppmp_files WHERE file_name = 'Operations_PPMP_2024.xlsx' LIMIT 1), 'Industrial Equipment', 'Manufacturing equipment for operations', 'unit', 5, 100000.00, 500000.00, 5, 500000.00, 'Machinery', 'Public Bidding', 'Q2'),
((SELECT id FROM ppmp_files WHERE file_name = 'Operations_PPMP_2024.xlsx' LIMIT 1), 'Safety Equipment', 'Personal protective equipment and safety gear', 'set', 100, 1500.00, 150000.00, 100, 150000.00, 'Safety', 'Shopping', 'Q1');

-- Create sample Purchase Requests for different departments
INSERT INTO purchase_requests (department_id, ppmp_file_id, requested_by, total_amount, status, pr_number, purpose) VALUES 
((SELECT id FROM departments WHERE code = 'IT' LIMIT 1), (SELECT id FROM ppmp_files WHERE file_name = 'IT_PPMP_2024.xlsx' LIMIT 1), (SELECT id FROM profiles WHERE email = 'joshpensawon@gmail.com' LIMIT 1), 500000.00, 'approved', generate_document_number('PR', 'purchase_requests'), 'Procurement of desktop computers for development team'),
((SELECT id FROM departments WHERE code = 'HR' LIMIT 1), (SELECT id FROM ppmp_files WHERE file_name = 'HR_PPMP_2024.xlsx' LIMIT 1), (SELECT id FROM profiles WHERE email = 'joshpensawon@gmail.com' LIMIT 1), 180000.00, 'pending', generate_document_number('PR', 'purchase_requests'), 'Office furniture for new employees'),
((SELECT id FROM departments WHERE code = 'OPS' LIMIT 1), (SELECT id FROM ppmp_files WHERE file_name = 'Operations_PPMP_2024.xlsx' LIMIT 1), (SELECT id FROM profiles WHERE email = 'joshpensawon@gmail.com' LIMIT 1), 150000.00, 'draft', generate_document_number('PR', 'purchase_requests'), 'Safety equipment for operations team');

-- Create sample PR items
INSERT INTO pr_items (pr_id, ppmp_item_id, item_name, description, unit, quantity, unit_cost, total_cost, budget_category) VALUES 
-- IT PR items
((SELECT id FROM purchase_requests WHERE purpose LIKE '%desktop computers%' LIMIT 1), (SELECT id FROM ppmp_items WHERE item_name = 'Desktop Computers' LIMIT 1), 'Desktop Computers', 'High-performance desktop computers for developers', 'unit', 20, 25000.00, 500000.00, 'Equipment'),

-- HR PR items
((SELECT id FROM purchase_requests WHERE purpose LIKE '%Office furniture%' LIMIT 1), (SELECT id FROM ppmp_items WHERE item_name = 'Office Furniture' LIMIT 1), 'Office Furniture', 'Ergonomic office chairs and desks', 'set', 15, 12000.00, 180000.00, 'Furniture'),

-- Operations PR items
((SELECT id FROM purchase_requests WHERE purpose LIKE '%Safety equipment%' LIMIT 1), (SELECT id FROM ppmp_items WHERE item_name = 'Safety Equipment' LIMIT 1), 'Safety Equipment', 'Personal protective equipment and safety gear', 'set', 100, 1500.00, 150000.00, 'Safety');

-- Create a sample Purchase Order (generated from approved PR)
INSERT INTO purchase_orders (total_amount, status, delivery_status, created_by, po_number, supplier_name, supplier_address, supplier_contact, terms_conditions) VALUES 
(500000.00, 'approved', 'not_delivered', (SELECT id FROM profiles WHERE email = 'joshpensawon@gmail.com' LIMIT 1), generate_document_number('PO', 'purchase_orders'), 'TechSupply Corp', '123 Technology Avenue, Business District', '+63-2-123-4567', 'Net 30 days payment terms. Delivery within 15 business days.');

-- Create PO items (linked to PR items)
INSERT INTO po_items (po_id, pr_item_id, quantity, unit_cost, total_cost, remaining_quantity) VALUES 
((SELECT id FROM purchase_orders WHERE supplier_name = 'TechSupply Corp' LIMIT 1), (SELECT id FROM pr_items WHERE item_name = 'Desktop Computers' LIMIT 1), 20, 25000.00, 500000.00, 20);

-- Create a sample Inspection Report
INSERT INTO inspection_reports (po_id, inspector_id, inspection_date, overall_result, iar_number, remarks) VALUES 
((SELECT id FROM purchase_orders WHERE supplier_name = 'TechSupply Corp' LIMIT 1), (SELECT id FROM profiles WHERE email = 'joshpensawon@gmail.com' LIMIT 1), CURRENT_DATE, 'accepted', generate_document_number('IAR', 'inspection_reports'), 'All items received in good condition and meet specifications.');

-- Create IAR items
INSERT INTO iar_items (iar_id, po_item_id, inspected_quantity, accepted_quantity, rejected_quantity, result, remarks) VALUES 
((SELECT id FROM inspection_reports WHERE overall_result = 'accepted' LIMIT 1), (SELECT id FROM po_items WHERE quantity = 20 LIMIT 1), 20, 20, 0, 'accepted', 'All desktop computers passed quality inspection.');

-- Create a sample Disbursement Voucher
INSERT INTO disbursement_vouchers (iar_id, po_id, amount, status, created_by, dv_number, payee_name, payment_method) VALUES 
((SELECT id FROM inspection_reports WHERE overall_result = 'accepted' LIMIT 1), (SELECT id FROM purchase_orders WHERE supplier_name = 'TechSupply Corp' LIMIT 1), 500000.00, 'for_signature', (SELECT id FROM profiles WHERE email = 'joshpensawon@gmail.com' LIMIT 1), generate_document_number('DV', 'disbursement_vouchers'), 'TechSupply Corp', 'Bank Transfer');