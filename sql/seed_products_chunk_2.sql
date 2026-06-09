with data(nombre, descripcion, precio) as (
values
    ('DIFUNTA CORREA (Tamano: 20CM)', 'Tamano: 20CM', 7015.00),
    ('DIVINO NINO (Tamano: 20CM)', 'Tamano: 20CM', 8400.00),
    ('DULCE ESPERA (Tamano: 20CM)', 'Tamano: 20CM', 7015.00),
    ('ESPIRITU SANTO (Tamano: 20CM)', 'Tamano: 20CM', 8625.00),
    ('GAUCHITO GIL (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('INMACULADA CONSEPCION (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('JESUS DE LA MISERICORDIA (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('LOURDES CON BERNARDITA (Tamano: 20CM)', 'Tamano: 20CM', 9500.00),
    ('LUORDES CON BERNARDA NUEVA (Tamano: 20CM)', 'Tamano: 20CM', 17250.00),
    ('MADRE MARAVILLA (Tamano: 20CM)', 'Tamano: 20CM', 7015.00),
    ('MADRE TERESA DE CALCUTA (Tamano: 20CM)', 'Tamano: 20CM', 8400.00),
    ('MAMA ANTULA X 20 CM (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('MARIA AUXILIADORA (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('NINO DE PREGA (Tamano: 20CM)', 'Tamano: 20CM', 8400.00),
    ('NTRA.SRA.DE SCHOENTATT (Tamano: 20CM)', 'Tamano: 20CM', 8625.00),
    ('PADRE PIO (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('PASTORES (FATIMA )3 UND (Tamano: 20CM)', 'Tamano: 20CM', 12524.00),
    ('POMPEYA (Tamano: 20CM)', 'Tamano: 20CM', 10000.00),
    ('ROSA MISTICA (Tamano: 20CM)', 'Tamano: 20CM', 7015.00),
    ('SAGRADA FAMILIA (BUSTO) (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('SAGRADA FAMILIA (PIE) (Tamano: 20CM)', 'Tamano: 20CM', 8625.00),
    ('SAGRADA FAMILIA BUSTO (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('SAGRADO CORAZON DE JESUS (Tamano: 20CM)', 'Tamano: 20CM', 8400.00),
    ('SAN ANTONIO (Tamano: 20CM)', 'Tamano: 20CM', 7015.00),
    ('SAN BENITO (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('SAN CAYETANO (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('SAN EXPEDITO (Tamano: 20CM)', 'Tamano: 20CM', 8400.00),
    ('SAN FRANCISCO (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('SAN JORGE (Tamano: 20CM)', 'Tamano: 20CM', 8625.00),
    ('SAN JOSE (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('SAN JOSE DE CUPERTINO (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('SAN JOSE DORMIDO X 20 CM (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('SAN JUAN BOSCO (Tamano: 20CM)', 'Tamano: 20CM', 7015.00),
    ('SAN JUDAS TADEO (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('SAN MARCO DE LEON (Tamano: 20CM)', 'Tamano: 20CM', 8625.00),
    ('SAN MARTIN DE PORRE (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('SAN MIGEL (Tamano: 20CM)', 'Tamano: 20CM', 8625.00),
    ('SAN PANTALION (Tamano: 20CM)', 'Tamano: 20CM', 8400.00),
    ('SAN ROQUE (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('SANTA BARBARA (Tamano: 20CM)', 'Tamano: 20CM', 8400.00),
    ('SANTA BERNARDITA (Tamano: 20CM)', 'Tamano: 20CM', 7015.00),
    ('SANTA CATALINA (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('SANTA LUCIA (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('SANTA RITA (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('SANTA ROSA DE LIMA (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('SANTA TERESITA (Tamano: 20CM)', 'Tamano: 20CM', 7015.00),
    ('V DE CAACUPE (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('V DE FATIMA (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('V DE GUADALUPE DE (MEXICO) (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('V DE GUADALUPE DE (SANTA FE ) (Tamano: 20CM)', 'Tamano: 20CM', 8625.00),
    ('V DE ITATI (Tamano: 20CM)', 'Tamano: 20CM', 8400.00),
    ('V DE LA CANDELARIA (Tamano: 20CM)', 'Tamano: 20CM', 8400.00)
)
insert into productos (nombre, descripcion, precio, stock_quantity)
select data.nombre, data.descripcion, data.precio, 0
from data
where not exists (select 1 from productos p where p.nombre = data.nombre);

insert into producto_caracteristicas (producto_id, posicion, caracteristica)
select p.id, 0, p.descripcion from productos p
where p.descripcion is not null
and not exists (select 1 from producto_caracteristicas pc where pc.producto_id = p.id and pc.posicion = 0);
