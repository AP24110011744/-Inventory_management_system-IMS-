INSERT IGNORE INTO categories(name) VALUES ('Electronics'),('Stationery'),('Office Equipment'),('Accessories');
--> statement-breakpoint
INSERT IGNORE INTO products(sku,name,category_id,supplier,quantity,reorder_level,unit_price)
SELECT 'LAP-001','Business Laptop',id,'Tech World',24,8,799.99 FROM categories WHERE name='Electronics';
--> statement-breakpoint
INSERT IGNORE INTO products(sku,name,category_id,supplier,quantity,reorder_level,unit_price)
SELECT 'PEN-001','Premium Ball Pen',id,'Office Hub',180,50,1.99 FROM categories WHERE name='Stationery';
--> statement-breakpoint
INSERT IGNORE INTO products(sku,name,category_id,supplier,quantity,reorder_level,unit_price)
SELECT 'MON-001','24 inch Monitor',id,'Tech World',12,5,189.50 FROM categories WHERE name='Office Equipment';
