with data(nombre, descripcion, precio) as (
values
    ('ESPIRITU SANTO (Categoria: PILAS AGUA BENDITA)', 'Categoria: PILAS AGUA BENDITA', 9430.00),
    ('ROSA MISTICA (Categoria: PILAS AGUA BENDITA)', 'Categoria: PILAS AGUA BENDITA', 9430.00),
    ('SAGRADA FAMILIA (Categoria: PILAS AGUA BENDITA)', 'Categoria: PILAS AGUA BENDITA', 9430.00),
    ('SAGRADO CORAZON DE JESUS (Categoria: PILAS AGUA BENDITA)', 'Categoria: PILAS AGUA BENDITA', 9430.00),
    ('SAN BENITO (Categoria: PILAS AGUA BENDITA)', 'Categoria: PILAS AGUA BENDITA', 9430.00),
    ('SANTA RITA (Categoria: PILAS AGUA BENDITA)', 'Categoria: PILAS AGUA BENDITA', 9430.00),
    ('V DE LOURDES (Categoria: PILAS AGUA BENDITA)', 'Categoria: PILAS AGUA BENDITA', 9430.00),
    ('ANGEL FIGURA MUSICAL X 4 UND (Categoria: PLACAS)', 'Categoria: PLACAS', 34500.00),
    ('CRUZ 20 X30 CM (Categoria: PLACAS)', 'Categoria: PLACAS', 11500.00),
    ('DIVINO NINO (Categoria: PLACAS)', 'Categoria: PLACAS', 13800.00),
    ('ESPIRITU SANTO (Categoria: PLACAS)', 'Categoria: PLACAS', 13800.00),
    ('P. ANGEL DE LA GUARDA GRANDE(OBAL) (Categoria: PLACAS)', 'Categoria: PLACAS', 27800.00),
    ('P.SAGRADO CORAZON DE JESUS 30X40CM (Categoria: PLACAS)', 'Categoria: PLACAS', 27800.00),
    ('PLACA DE MARIA AUXILIADORA CHICA (Categoria: PLACAS)', 'Categoria: PLACAS', 9775.00),
    ('PLACA DE ROSA MISTICA CHICA (Categoria: PLACAS)', 'Categoria: PLACAS', 9775.00),
    ('PLATO ANGEL DE LA GUARDA (Categoria: PLACAS)', 'Categoria: PLACAS', 13800.00),
    ('ROSTRO DE CRISTO (Categoria: PLACAS)', 'Categoria: PLACAS', 13800.00),
    ('SAGRADA FAMILIA (Categoria: PLACAS)', 'Categoria: PLACAS', 13800.00),
    ('SAGRADO CORAZON DE JESUS (Categoria: PLACAS)', 'Categoria: PLACAS', 13800.00),
    ('SAGRADO CORAZON DE MARIA (Categoria: PLACAS)', 'Categoria: PLACAS', 13800.00),
    ('SAN JORGE (Categoria: PLACAS)', 'Categoria: PLACAS', 13800.00),
    ('V DE LOUREDES (Categoria: PLACAS)', 'Categoria: PLACAS', 13800.00),
    ('V DEL CARMEN (Categoria: PLACAS)', 'Categoria: PLACAS', 13800.00),
    ('CAPILLAS (OTROS Y GRUTAS)', 'OTROS Y GRUTAS', 13800.00),
    ('GRUTAS X 10 CM (OTROS Y GRUTAS)', 'OTROS Y GRUTAS', 4830.00),
    ('GRUTAS X 15 CM 2P (OTROS Y GRUTAS)', 'OTROS Y GRUTAS', 8625.00),
    ('GRUTAS X 20 CM 2P (M IMPORTADO) (OTROS Y GRUTAS)', 'OTROS Y GRUTAS', 13800.00),
    ('GRUTAS X 30 CM 2P (M IMPORTADO) (OTROS Y GRUTAS)', 'OTROS Y GRUTAS', 29100.00),
    ('GRUTAS X 5 CM (OTROS Y GRUTAS)', 'OTROS Y GRUTAS', 2120.00),
    ('PORTA VELA (OTROS Y GRUTAS)', 'OTROS Y GRUTAS', 7475.00),
    ('CURA BROCHERO (Tamano: 100 CM)', 'Tamano: 100 CM', 200000.00),
    ('ROSA MISTICA (Tamano: 100 CM)', 'Tamano: 100 CM', 200000.00),
    ('SAN CAYETANO (Tamano: 100 CM)', 'Tamano: 100 CM', 250000.00),
    ('CRISTO CRUCIFICADO (Tamano: 120CM)', 'Tamano: 120CM', 402500.00),
    ('MARIA AUXILIADORA (Tamano: 120CM)', 'Tamano: 120CM', 685000.00),
    ('SAN FRANCISCO (Tamano: 120CM)', 'Tamano: 120CM', 400000.00),
    ('SAN JOSE (Tamano: 120CM)', 'Tamano: 120CM', 685000.00),
    ('V DE FATIMA (Tamano: 120CM)', 'Tamano: 120CM', 506000.00),
    ('ANGEL DE LA GUARDA (Tamano: 20CM)', 'Tamano: 20CM', 8625.00),
    ('ANGEL ORANDO (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('ARCANGE CHAMUEL (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('ARCANGEL GABRIEL (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('ARCANGEL JOFIEL (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('ARCANGEL RAFAEL (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('ARCANGEL URIEL (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('ARCANGELZAQUIEL (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('BROCHERO (MULA) (Tamano: 20CM)', 'Tamano: 20CM', 8625.00),
    ('BUSTO MADRE TERESA 20X20 (Tamano: 20CM)', 'Tamano: 20CM', 17250.00),
    ('CEFERINO NAMUCURA (Tamano: 20CM)', 'Tamano: 20CM', 7015.00),
    ('CORAZON DE MARIA (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('CURA BROCHERO (CILLA ) (Tamano: 20CM)', 'Tamano: 20CM', 7820.00),
    ('CURA BROCHERO (PONCHO) (Tamano: 20CM)', 'Tamano: 20CM', 7820.00)
)
insert into productos (nombre, descripcion, precio, stock_quantity)
select data.nombre, data.descripcion, data.precio, 0
from data
where not exists (select 1 from productos p where p.nombre = data.nombre);

insert into producto_caracteristicas (producto_id, posicion, caracteristica)
select p.id, 0, p.descripcion from productos p
where p.descripcion is not null
and not exists (select 1 from producto_caracteristicas pc where pc.producto_id = p.id and pc.posicion = 0);
