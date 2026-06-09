with data(nombre, descripcion, precio) as (
values
    ('V DE LA MEDALLA MILAGROSA (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('V DE LA MERCEDES (Tamano: 20CM)', 'Tamano: 20CM', 8400.00),
    ('V DE LA MERCEDES (GENERALA ) (Tamano: 20CM)', 'Tamano: 20CM', 8400.00),
    ('V DE LA PAZ (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('V DE LORDES (AUREOLA) (Tamano: 20CM)', 'Tamano: 20CM', 7015.00),
    ('V DE LOURDES (Tamano: 20CM)', 'Tamano: 20CM', 7015.00),
    ('V DE LOURDES (D) (Tamano: 20CM)', 'Tamano: 20CM', 7015.00),
    ('V DE LOURDES (DELGADA ) (Tamano: 20CM)', 'Tamano: 20CM', 6325.00),
    ('V DE LOURDES (T) (Tamano: 20CM)', 'Tamano: 20CM', 7015.00),
    ('V DE LOURDES (V.R.CH) (Tamano: 20CM)', 'Tamano: 20CM', 7015.00),
    ('V DE LOURDES (V.R.G) (Tamano: 20CM)', 'Tamano: 20CM', 7015.00),
    ('V DE LOURDES DELGADA ( T) (Tamano: 20CM)', 'Tamano: 20CM', 6325.00),
    ('V DE LUJAN X 22 CM (Tamano: 20CM)', 'Tamano: 20CM', 10000.00),
    ('V DEL CARMEN (Tamano: 20CM)', 'Tamano: 20CM', 8400.00),
    ('V DEL MILAGRO CORONA (Tamano: 20CM)', 'Tamano: 20CM', 7015.00),
    ('V DEL ROSARIO DE SAN NICOLAS (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('V DEL VALLE DE CATAMARCA (Tamano: 20CM)', 'Tamano: 20CM', 8400.00),
    ('V DESATANUDA (Tamano: 20CM)', 'Tamano: 20CM', 8400.00),
    ('V DOLOROZA (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('V MARIA (Tamano: 20CM)', 'Tamano: 20CM', 7015.00),
    ('CURA BROCHERO PONCHO (Tamano: 30 CM)', 'Tamano: 30 CM', 17940.00),
    ('GUADALUPE DE MEXICO (Tamano: 30 CM)', 'Tamano: 30 CM', 17940.00),
    ('INMACULADA CONCEPCION (Tamano: 30 CM)', 'Tamano: 30 CM', 12880.00),
    ('MARIA AUXILIADORA (Tamano: 30 CM)', 'Tamano: 30 CM', 17940.00),
    ('MEDALLA MILAGROSA (Tamano: 30 CM)', 'Tamano: 30 CM', 12880.00),
    ('SAGRADO CORAZON DE JESUS (Tamano: 30 CM)', 'Tamano: 30 CM', 12880.00),
    ('SAN ANTONIO (Tamano: 30 CM)', 'Tamano: 30 CM', 12880.00),
    ('SAN CAYETANO (Tamano: 30 CM)', 'Tamano: 30 CM', 12880.00),
    ('SAN MARCO DE LEON (Tamano: 30 CM)', 'Tamano: 30 CM', 12880.00),
    ('SAN ROQUE (Tamano: 30 CM)', 'Tamano: 30 CM', 12880.00),
    ('SANTA BARBARA (Tamano: 30 CM)', 'Tamano: 30 CM', 12880.00),
    ('SANTA CATALINA (Tamano: 30 CM)', 'Tamano: 30 CM', 12880.00),
    ('V DE LOURDES (Tamano: 30 CM)', 'Tamano: 30 CM', 12880.00),
    ('V DE LOURDES (AUREOLA ) (Tamano: 30 CM)', 'Tamano: 30 CM', 12880.00),
    ('V DE LOURDES (DELGADA) (Tamano: 30 CM)', 'Tamano: 30 CM', 12880.00),
    ('CURA BROCHERO (Tamano: 40 CM)', 'Tamano: 40 CM', 36400.00),
    ('DIVINO NINO (Tamano: 40 CM)', 'Tamano: 40 CM', 36400.00),
    ('GAUCHITO GIL (Tamano: 40 CM)', 'Tamano: 40 CM', 36400.00),
    ('INMACULADA CONSEPCION (Tamano: 40 CM)', 'Tamano: 40 CM', 36400.00),
    ('JESUS DE LA MISERICORDIA (Tamano: 40 CM)', 'Tamano: 40 CM', 36400.00),
    ('MARIA AUXILIADORA (Tamano: 40 CM)', 'Tamano: 40 CM', 36400.00),
    ('ROSA MISTICA (Tamano: 40 CM)', 'Tamano: 40 CM', 36400.00),
    ('SAGRADO CORAZON DE JESUS (Tamano: 40 CM)', 'Tamano: 40 CM', 36400.00),
    ('SAGRADO CORAZON VEN A MY (Tamano: 40 CM)', 'Tamano: 40 CM', 36400.00),
    ('SAN EXPEDITO (Tamano: 40 CM)', 'Tamano: 40 CM', 36400.00),
    ('SAN JOSE (Tamano: 40 CM)', 'Tamano: 40 CM', 36400.00),
    ('V DE FATIMA (Tamano: 40 CM)', 'Tamano: 40 CM', 36400.00),
    ('V DE GUADALUPE DE (SANTA FE ) (Tamano: 40 CM)', 'Tamano: 40 CM', 52500.00),
    ('V DE GUADALUPE DE MEXICO (Tamano: 40 CM)', 'Tamano: 40 CM', 45300.00),
    ('V DE LORDES (Tamano: 40 CM)', 'Tamano: 40 CM', 29200.00),
    ('V DE LOURDES (DELGADA) (Tamano: 40 CM)', 'Tamano: 40 CM', 29200.00),
    ('V DE LOURDES (DORADA ) (Tamano: 40 CM)', 'Tamano: 40 CM', 29200.00)
)
insert into productos (nombre, descripcion, precio, stock_quantity)
select data.nombre, data.descripcion, data.precio, 0
from data
where not exists (select 1 from productos p where p.nombre = data.nombre);

insert into producto_caracteristicas (producto_id, posicion, caracteristica)
select p.id, 0, p.descripcion from productos p
where p.descripcion is not null
and not exists (select 1 from producto_caracteristicas pc where pc.producto_id = p.id and pc.posicion = 0);
