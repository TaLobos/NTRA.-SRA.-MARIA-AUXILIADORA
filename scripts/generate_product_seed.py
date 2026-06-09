from decimal import Decimal
import json
import os
import re
import unicodedata

import openpyxl


ROOT = r"C:\Users\MSI Thin 15\Desktop\Vscode\AI\NTRA.-SRA.-MARIA-AUXILIADORA"
FILES = [
    r"D:\Trabajo mariano\excel final\cuenta corriente 2.xlsm",
    r"D:\Trabajo mariano\excel final\LISTA DE PRECIO ALTA GRACIA.xlsm",
    r"D:\Trabajo mariano\excel final\LISTA DE PRECIOS.xlsm",
    r"D:\Trabajo mariano\excel final\SANTUARIO.xlsm",
]


def clean(value):
    return re.sub(r"\s+", " ", str(value).strip())


def section_label(value):
    return (
        clean(value)
        .strip("- ")
        .replace("TAMAÑO:", "Tamaño:")
        .replace("CATEGORÍA:", "Categoría:")
        .strip()
    )


def ascii_text(value):
    normalized = unicodedata.normalize("NFKD", str(value))
    return normalized.encode("ascii", "ignore").decode("ascii")


def is_product(name, price):
    if not name:
        return False

    normalized = clean(name)
    upper = normalized.upper()
    if normalized.startswith("---"):
        return False
    if upper in {"PRODUCTO / CATEGORÍA", "PRODUCTO / CATEGORIA"}:
        return False
    if "ARTESANIAS" in upper or "NTRA. SRA." in upper:
        return False
    if upper.startswith("LISTA") or upper.startswith("SANTUARIOS"):
        return False

    return isinstance(price, (int, float)) and price >= 0


def sql_quote(value):
    return "'" + str(value).replace("'", "''") + "'"


def generated_description(name):
    upper = ascii_text(name).upper()
    if "ESPIRITU" in upper:
        quote = "El Espiritu viene en ayuda de nuestra debilidad. Romanos 8:26"
    elif "MARIA" in upper or "VIRGEN" in upper or "ROSA" in upper:
        quote = "Hagan todo lo que el les diga. Juan 2:5"
    elif "FAMILIA" in upper:
        quote = "Yo y mi casa serviremos al Senor. Josue 24:15"
    elif "CRISTO" in upper or "CRUZ" in upper:
        quote = "Por sus heridas fuimos sanados. Isaias 53:5"
    else:
        quote = "Que el Dios de la esperanza los llene de alegria y paz. Romanos 15:13"
    return f"{ascii_text(name)} es una pieza de arte sacro para acompanar la oracion y la vida de fe. {quote}"


def features_for(section):
    features = []
    clean_section = ascii_text(section)
    if clean_section.startswith("Tamano:"):
        features.append("Categoria: Imagenes religiosas")
        features.append(clean_section.replace("Tamano:", "Medida:").strip())
    elif clean_section:
        features.append(f"Categoria: {clean_section.replace('Categoria:', '').strip()}")
    if not features:
        features.append("Categoria: General")
    return features


def main():
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
    missing = []
    for section, name in sorted(all_pairs):
        key = (section, name)
        if key not in prices:
            missing.append(key)
            continue
        display_name = name
        products.append((display_name, section, prices[key]))

    lines = [
        "-- Seed generado desde Excel. Precios solo desde LISTA DE PRECIOS.xlsm",
        "begin;",
        (
            "insert into usuarios "
            "(nombre, apellido, organizacion, pais, provincia, ciudad, direccion, codigo_postal, email, telefono, rol) "
            "values ('Tomas', 'Lobos', 'NTRA. SRA. MARIA AUXILIADORA', 'Argentina', 'Cordoba', "
            "'Alta Gracia', 'Sin especificar', '0000', 'tomas.alberto.lobos123@gmail.com', null, 'ADMIN') "
            "on conflict (email) do update set rol = 'ADMIN', nombre = excluded.nombre, "
            "apellido = excluded.apellido, organizacion = excluded.organizacion;"
        ),
    ]

    lines.append("with data(nombre, descripcion, precio) as (")
    lines.append("values")
    value_lines = []
    for display_name, section, price in products:
        value_lines.append(
            f"    ({sql_quote(ascii_text(display_name))}, {sql_quote(generated_description(display_name))}, {price})"
        )
    lines.append(",\n".join(value_lines))
    lines.append(")")
    lines.append(
        "insert into productos (nombre, descripcion, precio, stock_quantity) "
        "select data.nombre, data.descripcion, data.precio, 0 "
        "from data "
        "where not exists (select 1 from productos p where p.nombre = data.nombre);"
    )
    lines.append(
        "insert into producto_caracteristicas (producto_id, posicion, caracteristica) "
        "select p.id, 0, p.descripcion from productos p "
        "where p.descripcion is not null "
        "and not exists (select 1 from producto_caracteristicas pc where pc.producto_id = p.id and pc.posicion = 0);"
    )

    lines.append("commit;")

    output = os.path.join(ROOT, "sql", "seed_products_from_excels.sql")
    with open(output, "w", encoding="utf-8", newline="\n") as file:
        file.write("\n".join(lines) + "\n")

    frontend_seed = []
    for index, (display_name, section, price) in enumerate(products, start=1):
        frontend_seed.append({
            "id": index,
            "nombre": ascii_text(display_name),
            "descripcion": generated_description(display_name),
            "precio": float(price),
            "stockQuantity": 0,
            "fotos": ["https://placehold.co/900x700/f1e5d1/9a650c?text=Arte+Sacro"],
            "caracteristicas": features_for(section),
        })

    frontend_output = os.path.join(ROOT, "frontend", "products.seed.json")
    with open(frontend_output, "w", encoding="utf-8", newline="\n") as file:
        json.dump(frontend_seed, file, ensure_ascii=False, indent=2)
        file.write("\n")

    print(f"seed_file={output}")
    print(f"frontend_seed={frontend_output}")
    print(f"products={len(products)}")
    print(f"missing_prices={len(missing)}")
    for section, name in missing:
        print(f"missing_price={name} ({section})")


if __name__ == "__main__":
    main()
