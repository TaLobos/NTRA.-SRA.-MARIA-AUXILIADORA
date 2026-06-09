with data(nombre, descripcion, precio) as (
values
    ('V DE LUJAN (Tamano: 40 CM)', 'Tamano: 40 CM', 45300.00),
    ('V DE MEDALLA MILAGROSA (Tamano: 40 CM)', 'Tamano: 40 CM', 36400.00),
    ('V DEL CARMEN (Tamano: 40 CM)', 'Tamano: 40 CM', 36400.00),
    ('V DEL ROSARIO DE SAN NICOLAS (Tamano: 40 CM)', 'Tamano: 40 CM', 36400.00),
    ('V DEL VALLE DE CATAMARCA (Tamano: 40 CM)', 'Tamano: 40 CM', 45300.00),
    ('MEDALLA MILAGROSA (Tamano: 55CM)', 'Tamano: 55CM', 46700.00),
    ('SAGRADO CORAZON DE JESUS (Tamano: 55CM)', 'Tamano: 55CM', 51200.00),
    ('V DE LOURDES (Tamano: 55CM)', 'Tamano: 55CM', 46700.00),
    ('V ROSA MISTICA (Tamano: 55CM)', 'Tamano: 55CM', 46700.00),
    ('CURA BROCHERO (Tamano: 70 CM)', 'Tamano: 70 CM', 73500.00),
    ('DIVINO NINO (Tamano: 70 CM)', 'Tamano: 70 CM', 84500.00),
    ('INMACULADA CONCEPCION (Tamano: 70 CM)', 'Tamano: 70 CM', 73500.00),
    ('JESUS DE LA MISERICORDIA X 70 CM (Tamano: 70 CM)', 'Tamano: 70 CM', 73500.00),
    ('MARIA AUXILIADORA (Tamano: 70 CM)', 'Tamano: 70 CM', 93725.00),
    ('ROSARIO DE SAN NICOLAS (Tamano: 70 CM)', 'Tamano: 70 CM', 93725.00),
    ('SAGRADO CORAZON DE JESUS (Tamano: 70 CM)', 'Tamano: 70 CM', 73500.00),
    ('SAN CAYETANO (Tamano: 70 CM)', 'Tamano: 70 CM', 73500.00),
    ('SAN JOSE X 70 CM (Tamano: 70 CM)', 'Tamano: 70 CM', 73500.00),
    ('SAN ROQUE (Tamano: 70 CM)', 'Tamano: 70 CM', 73500.00),
    ('SANTA BERNARDITA (Tamano: 70 CM)', 'Tamano: 70 CM', 80730.00),
    ('SANTA RITA X 70 CM (Tamano: 70 CM)', 'Tamano: 70 CM', 73500.00),
    ('V DE LOURDES (Tamano: 70 CM)', 'Tamano: 70 CM', 80730.00),
    ('V DE LUJAN (90 CM ) (Tamano: 70 CM)', 'Tamano: 70 CM', 93725.00),
    ('V DE MEDALLA MILAGROSA (Tamano: 70 CM)', 'Tamano: 70 CM', 73500.00),
    ('V DEL MILAGRO (Tamano: 70 CM)', 'Tamano: 70 CM', 73500.00),
    ('BROCHERO PONCHO (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('CURA BROCHERO (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('DIVINO NINO (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('DULCE ESPERA (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('ESTELA MARIS (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('GUADALUPE DE MEXICO (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('GUADALUPE DE SATA FE (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 5980.00),
    ('JUDAS TADEO (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('MARIA AUXILIADORA (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('MEDALLA MILAGROSA (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('MEDALLA MILAGROSA (RAYOS) (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('ROSA MISTICA (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('SAGRADO CORAZON DE JESUS (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 5980.00),
    ('SAN BENITO (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('SAN CAYETANO (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('SAN EXPEDITO (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('SAN JOSE (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('SAN JOSE DORMIDO (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('SAN PANTALEON (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('SAN ROQUE (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('SANTA RITA (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('V DE ITATI (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 5980.00),
    ('V DE LA SONRISA (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('V DE LOURDES (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('V DE LOURDES (AUREOLA) (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('V DE LOURDES (DELGADA) (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00),
    ('V DEL VALLE DE CATAMARCA (Tamano: IMAGENES 15 CM)', 'Tamano: IMAGENES 15 CM', 4485.00)
)
insert into productos (nombre, descripcion, precio, stock_quantity)
select data.nombre, data.descripcion, data.precio, 0
from data
where not exists (select 1 from productos p where p.nombre = data.nombre);

insert into producto_caracteristicas (producto_id, posicion, caracteristica)
select p.id, 0, p.descripcion from productos p
where p.descripcion is not null
and not exists (select 1 from producto_caracteristicas pc where pc.producto_id = p.id and pc.posicion = 0);
