import os

from generate_product_seed import FILES, ROOT, ascii_text, clean, is_product, section_label, sql_quote
from decimal import Decimal

import openpyxl


def extract_products():
    all_pairs = {}
    prices = {}

    for path in FILES:
        workbook = openpyxl.load_workbook(path, data_only=True, read_only=True)
        sheet = workbook.worksheets[0]
        section = ""

        for row in sheet.iter_rows(values_only=True):
            name = row[0] if len(row) > 0 else None
            price = row[1] if len(row) > 1 else None

            if name not in (None, "") and clean(name).startswith("---"):
                section = section_label(name)

            if not is_product(name, price):
                continue

            key = (section, clean(name))
            all_pairs.setdefault(key, set()).add(os.path.basename(path))
            if os.path.basename(path).upper() == "LISTA DE PRECIOS.XLSM":
                prices[key] = Decimal(str(price)).quantize(Decimal("0.01"))

    products = []
    for section, name in sorted(all_pairs):
        key = (section, name)
        if key not in prices:
            continue
        display_name = f"{name} ({section})" if section else name
        products.append((ascii_text(display_name), ascii_text(section), prices[key]))
    return products


def write_chunk(index, rows):
    lines = [
        "with data(nombre, descripcion, precio) as (",
        "values",
    ]
    values = [
        f"    ({sql_quote(name)}, {sql_quote(description)}, {price})"
        for name, description, price in rows
    ]
    lines.append(",\n".join(values))
    lines.extend(
        [
            ")",
            "insert into productos (nombre, descripcion, precio, stock_quantity)",
            "select data.nombre, data.descripcion, data.precio, 0",
            "from data",
            "where not exists (select 1 from productos p where p.nombre = data.nombre);",
            "",
            "insert into producto_caracteristicas (producto_id, posicion, caracteristica)",
            "select p.id, 0, p.descripcion from productos p",
            "where p.descripcion is not null",
            "and not exists (select 1 from producto_caracteristicas pc where pc.producto_id = p.id and pc.posicion = 0);",
        ]
    )
    output = os.path.join(ROOT, "sql", f"seed_products_chunk_{index}.sql")
    with open(output, "w", encoding="utf-8", newline="\n") as file:
        file.write("\n".join(lines) + "\n")
    return output


def main():
    products = extract_products()
    chunk_size = 52
    for index, start in enumerate(range(0, len(products), chunk_size), start=1):
        output = write_chunk(index, products[start : start + chunk_size])
        print(output)


if __name__ == "__main__":
    main()
