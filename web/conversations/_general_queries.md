
## Saved Query
Categorias con sus padres
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
