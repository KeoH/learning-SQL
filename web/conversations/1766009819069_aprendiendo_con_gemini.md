# Aprendiendo con GEMINI
<!-- database: techstore -->


## Query
```sql
SELECT DISTINCT p.name, p.price
FROM products p
JOIN order_items oi ON p.product_id = oi.product_id
ORDER BY p.price DESC
LIMIT 1;
```

## Result
| name | price |
| --- | --- |
| 4K Monitor | 300.00 |

## Query
```sql
SELECT name, price
FROM products
WHERE product_id IN (SELECT product_id FROM order_items)
ORDER BY price DESC
LIMIT 1;
```

## Result
| name | price |
| --- | --- |
| 4K Monitor | 300.00 |

## Query
```sql
SELECT * FROM users LIMIT 5;
```

## Result
| user_id | first_name | last_name | email | created_at | country | tags |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | User1 | Smith1 | user1@example.com | Sat Mar 22 2025 01:48:14 GMT+0000 (Coordinated Universal Time) | Spain | ["new"] |
| 2 | User2 | Smith2 | user2@example.com | Tue Jan 21 2025 22:23:38 GMT+0000 (Coordinated Universal Time) | Spain | ["vip","loyal"] |
| 3 | User3 | Smith3 | user3@example.com | Wed Dec 10 2025 22:20:54 GMT+0000 (Coordinated Universal Time) | USA | ["new"] |
| 4 | User4 | Smith4 | user4@example.com | Sat Jul 05 2025 02:04:10 GMT+0000 (Coordinated Universal Time) | Spain | ["vip","loyal"] |
| 5 | User5 | Smith5 | user5@example.com | Thu Feb 13 2025 05:32:02 GMT+0000 (Coordinated Universal Time) | Argentina | ["vip","loyal"] |

## Query
```sql
SELECT 
  u.first_name,
  u.last_name,
  u.email
FROM
  users u
LEFT JOIN
  orders o ON u.users_id = o.users_id
WHERE
  o.order_id IS NULL;
```

## Error
```
column u.users_id does not exist
```

## Query
```sql
SELECT 
  u.first_name,
  u.last_name,
  u.email
FROM
  users u
LEFT JOIN
  orders o ON u.user_id = o.user_id
WHERE
  o.order_id IS NULL;
```

## Result
| first_name | last_name | email |
| --- | --- | --- |
| User33 | Smith33 | user33@example.com |
| User34 | Smith34 | user34@example.com |
| User2 | Smith2 | user2@example.com |
| User21 | Smith21 | user21@example.com |
| User42 | Smith42 | user42@example.com |
| User36 | Smith36 | user36@example.com |
| User45 | Smith45 | user45@example.com |

## Note
Jerarquía de Categorías (SELF JOIN):

- Situación: La tabla categories tiene una columna parent_id que apunta a sí misma (ej: "Laptops" es hija de "Computers").

- Objetivo: Listar el nombre de cada categoría junto con el nombre de su categoría "padre".

## Diagram
erDiagram
    USERS ||--o{ ORDERS : "realiza"
    USERS ||--o{ REVIEWS : "escribe"
    CATEGORIES ||--o{ CATEGORIES : "padre de"
    CATEGORIES ||--o{ PRODUCTS : "contiene"
    PRODUCTS ||--o{ ORDER_ITEMS : "incluido en"
    ORDERS ||--o{ ORDER_ITEMS : "contiene"
    PRODUCTS ||--o{ REVIEWS : "recibe"

    USERS {
        int user_id PK
        string first_name
        string last_name
        string email
        timestamp created_at
        string country
        text_array tags
    }

    CATEGORIES {
        int category_id PK
        string name
        int parent_id FK
    }

    PRODUCTS {
        int product_id PK
        string name
        decimal price
        int stock
        int category_id FK
        jsonb attributes
        boolean is_active
    }

    ORDERS {
        int order_id PK
        int user_id FK
        string status
        timestamp order_date
        decimal total_amount
    }

    ORDER_ITEMS {
        int item_id PK
        int order_id FK
        int product_id FK
        int quantity
        decimal unit_price
    }

    REVIEWS {
        int review_id PK
        int user_id FK
        int product_id FK
        int rating
        text comment
        date created_at
    }

## Query
```sql
SELECT 
  hija.name AS categoria,
  padre.name AS superior
FROM
  categories hija
LEFT JOIN
  categories padre IN hija.parent_id = padre.category_id
ORDER BY
  superior NULLS FIRST;
```

## Error
```
syntax error at or near "IN"
```

## Query
```sql
SELECT 
    hija.name AS categoria,
    padre.name AS superior
FROM 
    categories hija
LEFT JOIN 
    categories padre ON hija.parent_id = padre.category_id
ORDER BY 
    superior NULLS FIRST;
```

## Result
| categoria | superior |
| --- | --- |
| Clothing | NULL |
| Electronics | NULL |
| T-Shirts | Clothing |
| Laptops | Computers |
| Smartphones | Electronics |
| Computers | Electronics |
| Accessories | Electronics |

## Query
```sql
WITH RECURSIVE ruta_categorias AS (
    -- Caso base: Categorías raíz (las que no tienen padre)
    SELECT category_id, name, name AS path, parent_id
    FROM categories
    WHERE parent_id IS NULL

    UNION ALL

    -- Caso recursivo: Unir hijos con sus padres ya encontrados
    SELECT c.category_id, c.name, rc.path || ' > ' || c.name, c.parent_id
    FROM categories c
    JOIN ruta_categorias rc ON c.parent_id = rc.category_id
)
SELECT name, path FROM ruta_categorias;
```

## Error
```
recursive query "ruta_categorias" column 3 has type character varying(50) in non-recursive term but type character varying overall
```

## Query
```sql
SELECT 
    c.name AS categoria,
    SUM(oi.quantity * oi.unit_price) AS total_ventas,
    COUNT(DISTINCT oi.order_id) AS numero_de_pedidos
FROM 
    categories c
JOIN 
    products p ON c.category_id = p.category_id
JOIN 
    order_items oi ON p.product_id = oi.product_id
GROUP BY 
    c.name
ORDER BY 
    total_ventas DESC;
```

## Result
| categoria | total_ventas | numero_de_pedidos |
| --- | --- | --- |
| Computers | 182400.00 | 97 |

## Query
```sql
INSERT INTO orders (user_id, status, order_date, total_amount)
SELECT 
    floor(random() * 50 + 1),
    (ARRAY['pending', 'completed', 'shipped', 'cancelled'])[floor(random() * 4 + 1)],
    NOW() - (random() * (INTERVAL '100 days')),
    0 -- Se actualizará después
FROM generate_series(1, 100) AS i;
```

## Result
_Query executed successfully. Rows affected: 100_

## Query
```sql
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT 
    floor(random() * 100 + 1), -- order_id aleatorio
    p.product_id,
    floor(random() * 3 + 1),   -- cantidad 1 a 3
    p.price
FROM generate_series(1, 300) AS i, -- 300 items en total
LATERAL (SELECT product_id, price FROM products ORDER BY random() LIMIT 1) p;
```

## Result
_Query executed successfully. Rows affected: 300_

## Query
```sql
UPDATE orders o
SET total_amount = (
    SELECT SUM(quantity * unit_price)
    FROM order_items oi
    WHERE oi.order_id = o.order_id
);

-- Insertar Reseñas
INSERT INTO reviews (user_id, product_id, rating, comment)
SELECT 
    floor(random() * 50 + 1),
    floor(random() * 7 + 1),
    floor(random() * 5 + 1),
    'This product is ' || (ARRAY['great', 'bad', 'okay', 'excellent'])[floor(random() * 4 + 1)]
FROM generate_series(1, 50);
```

## Result
_Query executed successfully. Rows affected: 200_

## Query
```sql
SELECT 
    c.name AS categoria,
    SUM(oi.quantity * oi.unit_price) AS total_ventas,
    COUNT(DISTINCT oi.order_id) AS numero_de_pedidos
FROM 
    categories c
JOIN 
    products p ON c.category_id = p.category_id
JOIN 
    order_items oi ON p.product_id = oi.product_id
GROUP BY 
    c.name
ORDER BY 
    total_ventas DESC;
```

## Result
| categoria | total_ventas | numero_de_pedidos |
| --- | --- | --- |
| Smartphones | 423493.95 | 93 |
| Computers | 182400.00 | 97 |

## Query
```sql
INSERT INTO orders (user_id, status, order_date, total_amount)
SELECT 
    floor(random() * 50 + 1),
    (ARRAY['pending', 'completed', 'shipped', 'cancelled'])[floor(random() * 4 + 1)],
    NOW() - (random() * (INTERVAL '100 days')),
    0 -- Se actualizará después
FROM generate_series(1, 100) AS i;

-- Insertar Items de Órdenes (Llenamos las órdenes con productos)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT 
    floor(random() * 100 + 1), -- order_id aleatorio
    p.product_id,
    floor(random() * 3 + 1),   -- cantidad 1 a 3
    p.price
FROM generate_series(1, 300) AS i, -- 300 items en total
LATERAL (SELECT product_id, price FROM products ORDER BY random() LIMIT 1) p;

-- Actualizar el total de las órdenes basado en los items (Update con Join/Subquery)
UPDATE orders o
SET total_amount = (
    SELECT SUM(quantity * unit_price)
    FROM order_items oi
    WHERE oi.order_id = o.order_id
);

-- Insertar Reseñas
INSERT INTO reviews (user_id, product_id, rating, comment)
SELECT 
    floor(random() * 50 + 1),
    floor(random() * 7 + 1),
    floor(random() * 5 + 1),
    'This product is ' || (ARRAY['great', 'bad', 'okay', 'excellent'])[floor(random() * 4 + 1)]
FROM generate_series(1, 50);
```

## Result
_Query executed successfully. Rows affected: 100_

## Query
```sql
INSERT INTO orders (user_id, status, order_date, total_amount)
SELECT 
    floor(random() * 50 + 1),
    (ARRAY['pending', 'completed', 'shipped', 'cancelled'])[floor(random() * 4 + 1)],
    NOW() - (random() * (INTERVAL '100 days')),
    0 -- Se actualizará después
FROM generate_series(1, 100) AS i;

-- Insertar Items de Órdenes (Llenamos las órdenes con productos)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT 
    floor(random() * 100 + 1), -- order_id aleatorio
    p.product_id,
    floor(random() * 3 + 1),   -- cantidad 1 a 3
    p.price
FROM generate_series(1, 300) AS i, -- 300 items en total
LATERAL (SELECT product_id, price FROM products ORDER BY random() LIMIT 1) p;

-- Actualizar el total de las órdenes basado en los items (Update con Join/Subquery)
UPDATE orders o
SET total_amount = (
    SELECT SUM(quantity * unit_price)
    FROM order_items oi
    WHERE oi.order_id = o.order_id
);

-- Insertar Reseñas
INSERT INTO reviews (user_id, product_id, rating, comment)
SELECT 
    floor(random() * 50 + 1),
    floor(random() * 7 + 1),
    floor(random() * 5 + 1),
    'This product is ' || (ARRAY['great', 'bad', 'okay', 'excellent'])[floor(random() * 4 + 1)]
FROM generate_series(1, 50);
```

## Result
_Query executed successfully. Rows affected: 100_

## Query
```sql
SELECT 
    c.name AS categoria,
    SUM(oi.quantity * oi.unit_price) AS total_ventas,
    COUNT(DISTINCT oi.order_id) AS numero_de_pedidos
FROM 
    categories c
JOIN 
    products p ON c.category_id = p.category_id
JOIN 
    order_items oi ON p.product_id = oi.product_id
GROUP BY 
    c.name
ORDER BY 
    total_ventas DESC;
```

## Result
| categoria | total_ventas | numero_de_pedidos |
| --- | --- | --- |
| Laptops | 2977500.00 | 100 |
| Smartphones | 423493.95 | 93 |
| Computers | 182400.00 | 97 |

## Query
```sql
SELECT 
    c.name AS categoria,
    SUM(oi.quantity * oi.unit_price) AS total_ventas,
    COUNT(DISTINCT oi.order_id) AS numero_de_pedidos
FROM 
    categories c
JOIN 
    products p ON c.category_id = p.category_id
JOIN 
    order_items oi ON p.product_id = oi.product_id
GROUP BY 
    c.name
ORDER BY 
    total_ventas DESC;
```

## Result
| categoria | total_ventas | numero_de_pedidos |
| --- | --- | --- |
| Laptops | 2977500.00 | 100 |
| Smartphones | 423493.95 | 93 |
| Computers | 182400.00 | 97 |


## Query
```sql
SELECT 
    c.name AS categoria,
    SUM(oi.quantity * oi.unit_price) AS total_ventas,
    COUNT(DISTINCT oi.order_id) AS numero_de_pedidos
FROM 
    categories c
JOIN 
    products p ON c.category_id = p.category_id
JOIN 
    order_items oi ON p.product_id = oi.product_id
GROUP BY 
    c.name
ORDER BY 
    total_ventas DESC;
```

## Result
| categoria | total_ventas | numero_de_pedidos |
| --- | --- | --- |
| Laptops | 2977500.00 | 100 |
| Smartphones | 423493.95 | 93 |
| Computers | 182400.00 | 97 |

## Saved Query
Ventas por categorias
```sql
SELECT 
    c.name AS categoria,
    SUM(oi.quantity * oi.unit_price) AS total_ventas,
    COUNT(DISTINCT oi.order_id) AS numero_de_pedidos
FROM 
    categories c
JOIN 
    products p ON c.category_id = p.category_id
JOIN 
    order_items oi ON p.product_id = oi.product_id
GROUP BY 
    c.name
ORDER BY 
    total_ventas DESC;
```
