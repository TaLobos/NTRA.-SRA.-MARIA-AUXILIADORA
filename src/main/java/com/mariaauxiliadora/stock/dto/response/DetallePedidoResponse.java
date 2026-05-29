package com.mariaauxiliadora.stock.dto.response;

/**
 * Vista de una línea de detalle de pedido.
 */
public class DetallePedidoResponse {

    private Long id;
    private ProductoResponse producto;
    private Integer cantidad;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ProductoResponse getProducto() { return producto; }
    public void setProducto(ProductoResponse producto) { this.producto = producto; }

    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
}