package com.mariaauxiliadora.stock.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Producto disponible en el stock físico.
 */
@Entity
@Table(name = "productos")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String nombre;

    @Column(columnDefinition = "TEXT")
    private String descripcion;

    @NotNull
    @DecimalMin(value = "0.0", inclusive = true)
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;

    @NotNull
    @Min(0)
    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity;

    @ElementCollection
    @CollectionTable(name = "producto_fotos", joinColumns = @JoinColumn(name = "producto_id"))
    @OrderColumn(name = "posicion")
    @Column(name = "url", nullable = false, length = 500)
    private List<String> fotos = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "producto_caracteristicas", joinColumns = @JoinColumn(name = "producto_id"))
    @OrderColumn(name = "posicion")
    @Column(name = "caracteristica", nullable = false, length = 500)
    private List<String> caracteristicas = new ArrayList<>();

    // ── Constructors ──────────────────────────────────────────────────────────

    public Producto() {}

    public Producto(String nombre, String descripcion, BigDecimal precio, Integer stockQuantity) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
        this.stockQuantity = stockQuantity;
    }

    // ── Getters & Setters ─────────────────────────────────────────────────────

    public Long getId() { return id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public BigDecimal getPrecio() { return precio; }
    public void setPrecio(BigDecimal precio) { this.precio = precio; }

    public Integer getStockQuantity() { return stockQuantity; }
    public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }

    public List<String> getFotos() { return fotos; }
    public void setFotos(List<String> fotos) {
        this.fotos = fotos == null ? new ArrayList<>() : new ArrayList<>(fotos);
    }

    public List<String> getCaracteristicas() { return caracteristicas; }
    public void setCaracteristicas(List<String> caracteristicas) {
        this.caracteristicas = caracteristicas == null ? new ArrayList<>() : new ArrayList<>(caracteristicas);
    }
}
